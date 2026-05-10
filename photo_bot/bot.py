#!/usr/bin/env python3
"""
Japan Trip Photo Bot
사진/영상을 텔레그램으로 보내면 일자/태그별로 앱 갤러리에 자동 추가됩니다.

캡션 형식: #N일차 #태그1 #태그2 설명 (예: #3일차 #가족 #기념 생신 파티 🎂)
"""

import os
import json
import uuid
import logging
import re
import subprocess
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

load_dotenv(Path(__file__).parent / '.env')

BOT_TOKEN = os.getenv('JAPAN_BOT_TOKEN', '')
ALLOWED_IDS_STR = os.getenv('ALLOWED_USER_IDS', '')
ALLOWED_USER_IDS = {int(x.strip()) for x in ALLOWED_IDS_STR.split(',') if x.strip()}

BASE_DIR = Path('/home/wini2x/japan-trip')
PHOTOS_DIR = BASE_DIR / 'public' / 'photos'
UPLOADS_JSON = PHOTOS_DIR / 'photo_uploads.json'

DAY_NAMES = {
    1: '아소산 · 유후인',
    2: '벳푸 탐방',
    3: '칠순 생신 · 료칸 ✨',
    4: '구로카와 · 구마모토',
    5: '귀국',
}

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler(Path(__file__).parent / 'bot.log'),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# 미디어 그룹 캡션 공유 (앨범 첫 장 캡션 → 나머지 장에 적용)
_group_captions: dict[str, str] = {}
_group_warned: set[str] = set()

# 사용자별 대기 캡션 (텍스트 먼저 보내고 나중에 사진 전송하는 방식)
# { user_id: {'caption': str, 'expires': float} }
_pending_captions: dict[int, dict] = {}
PENDING_TTL = 1800  # 30분


def parse_caption(text: str) -> tuple[int | None, list[str], str]:
    """캡션에서 (일자, 태그 목록, 설명) 파싱"""
    text = text.strip()

    day_match = re.search(r'#(\d)일차|#day(\d)\b', text, re.IGNORECASE)
    day_id = None
    if day_match:
        raw = day_match.group(1) or day_match.group(2)
        day_id = int(raw)

    all_tags = re.findall(r'#(\S+)', text)
    tags = [t for t in all_tags if not re.match(r'\d일차$|day\d$', t, re.IGNORECASE)]

    clean = re.sub(r'#\S+', '', text).strip()
    return day_id, tags, clean


def load_uploads() -> list:
    if UPLOADS_JSON.exists():
        try:
            with open(UPLOADS_JSON, encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return []


def save_uploads(uploads: list):
    UPLOADS_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(UPLOADS_JSON, 'w', encoding='utf-8') as f:
        json.dump(uploads, f, ensure_ascii=False, indent=2)


async def download_and_save(msg, context, caption: str) -> dict | None:
    """파일 다운로드 → 저장 → JSON 갱신. 성공 시 entry 반환."""
    day_id, tags, clean_caption = parse_caption(caption)

    if not day_id or not (1 <= day_id <= 5):
        await msg.reply_text(
            '📅 일자 태그를 넣어주세요!\n\n'
            '형식: #N일차 #태그 설명\n\n'
            '예시:\n'
            '  #1일차 #자연 아소산 풍경\n'
            '  #3일차 #가족 #기념 생신 파티 🎂\n'
            '  #5일차 구마모토성 앞에서\n\n'
            '일자: #1일차 ~ #5일차\n'
            '태그: #자연 #가족 #음식 #온천 #숙소 #기념 #쇼핑 등 자유'
        )
        return None

    # 파일 종류 판별
    media_type = 'photo'
    ext = 'jpg'
    tg_file = None
    file_size = 0
    MAX_MB = 19  # Telegram 봇 다운로드 한계 20MB, 여유 1MB

    if msg.photo:
        tg_file = await context.bot.get_file(msg.photo[-1].file_id)

    elif msg.video:
        file_size = msg.video.file_size or 0
        if file_size > MAX_MB * 1024 * 1024:
            size_mb = file_size // 1024 // 1024
            await msg.reply_text(
                f'⚠️ 영상이 너무 큽니다 ({size_mb}MB)\n\n'
                f'텔레그램 봇은 {MAX_MB}MB 이하만 받을 수 있어요.\n\n'
                '해결 방법:\n'
                '① 영상을 짧게 잘라서 재전송\n'
                '② 스마트폰 설정에서 화질 낮춰 재촬영\n'
                '③ 사진 앱에서 압축 후 전송'
            )
            return None
        try:
            tg_file = await context.bot.get_file(msg.video.file_id)
            ext = 'mp4'
            media_type = 'video'
        except Exception as e:
            logger.error(f'video get_file error: {e}')
            await msg.reply_text(f'⚠️ 영상 다운로드 실패\n{e}\n\n파일이 너무 크거나 손상됐을 수 있습니다.')
            return None

    elif msg.document:
        mime = msg.document.mime_type or ''
        file_size = msg.document.file_size or 0
        if file_size > MAX_MB * 1024 * 1024:
            size_mb = file_size // 1024 // 1024
            await msg.reply_text(
                f'⚠️ 파일이 너무 큽니다 ({size_mb}MB)\n'
                f'{MAX_MB}MB 이하로 압축 후 재전송해주세요.'
            )
            return None
        if mime.startswith('image/'):
            tg_file = await context.bot.get_file(msg.document.file_id)
            ext = mime.split('/')[-1].replace('jpeg', 'jpg')
        elif mime.startswith('video/'):
            try:
                tg_file = await context.bot.get_file(msg.document.file_id)
                # 원본 확장자 유지 (mov, mp4 등)
                orig = msg.document.file_name or ''
                ext = orig.rsplit('.', 1)[-1].lower() if '.' in orig else 'mp4'
                media_type = 'video'
            except Exception as e:
                logger.error(f'video doc get_file error: {e}')
                await msg.reply_text(f'⚠️ 영상 다운로드 실패\n{e}')
                return None

    if not tg_file:
        return None

    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    uid = uuid.uuid4().hex[:6]
    filename = f'day{day_id}_{ts}_{uid}.{ext}'
    save_path = PHOTOS_DIR / f'day{day_id}' / filename
    save_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        await tg_file.download_to_drive(str(save_path))
    except Exception as e:
        logger.error(f'download_to_drive error: {e}')
        await msg.reply_text(
            f'⚠️ 파일 저장 실패\n{e}\n\n'
            '파일이 20MB를 초과하면 다운로드가 불가합니다.'
        )
        return None

    # 영상인 경우 첫 프레임 썸네일 추출
    thumb_file = None
    if media_type == 'video':
        thumb_name = filename.rsplit('.', 1)[0] + '_thumb.jpg'
        thumb_path = save_path.parent / thumb_name
        try:
            subprocess.run(
                ['ffmpeg', '-y', '-i', str(save_path), '-vframes', '1', '-ss', '0',
                 '-vf', 'scale=480:-2', '-q:v', '3', str(thumb_path)],
                capture_output=True, timeout=30
            )
            if thumb_path.exists() and thumb_path.stat().st_size > 0:
                thumb_file = thumb_name
        except Exception as e:
            logger.warning(f'thumbnail extraction failed: {e}')

    entry = {
        'id': uid,
        'dayId': day_id,
        'file': filename,
        'type': media_type,
        'tags': tags,
        'caption': clean_caption,
        'timestamp': datetime.now().isoformat(),
    }
    if thumb_file:
        entry['thumb'] = thumb_file
    uploads = load_uploads()
    uploads.append(entry)
    save_uploads(uploads)

    logger.info(f'saved {media_type} → day{day_id}/{filename} tags={tags}')
    return entry


# ── Handlers ─────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    await update.message.reply_text(
        f'🌸 일본 여행 사진 봇\n\n'
        f'내 Telegram ID: {user.id}\n\n'
        f'【방법 1】 사진에 캡션 직접 달기\n'
        f'  사진 전송 + 캡션: #2일차 #자연 벳푸 온천\n\n'
        f'【방법 2】 캡션 먼저, 사진 나중에\n'
        f'  ① 텍스트 전송: #3일차 #가족 생신 파티 🎂\n'
        f'  ② 사진 여러 장 전송 (캡션 없이)\n'
        f'  → 30분 내 전송하면 자동 적용\n\n'
        f'/list — 업로드 현황\n'
        f'/clear — 대기 캡션 초기화\n'
        f'/undo — 마지막 파일 삭제'
    )


async def cmd_clear(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if ALLOWED_USER_IDS and user.id not in ALLOWED_USER_IDS:
        return
    if user.id in _pending_captions:
        del _pending_captions[user.id]
        await update.message.reply_text('🗑️ 대기 캡션을 초기화했습니다.')
    else:
        await update.message.reply_text('대기 중인 캡션이 없습니다.')


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """일반 텍스트 메시지 = 다음 사진용 캡션으로 저장"""
    user = update.effective_user
    if ALLOWED_USER_IDS and user.id not in ALLOWED_USER_IDS:
        return

    text = (update.message.text or '').strip()
    day_id, tags, clean = parse_caption(text)

    if not day_id or not (1 <= day_id <= 5):
        await update.message.reply_text(
            '📝 캡션 형식이 맞지 않아요.\n'
            '예: #3일차 #가족 #기념 생신 파티 🎂\n\n'
            '일자(#N일차)가 반드시 포함되어야 합니다.'
        )
        return

    import time
    _pending_captions[user.id] = {
        'caption': text,
        'expires': time.time() + PENDING_TTL,
    }

    tags_str = ' '.join(f'#{t}' for t in tags) or '없음'
    await update.message.reply_text(
        f'✅ 캡션 저장! 이제 사진을 보내주세요.\n\n'
        f'📅 {day_id}일차 · {DAY_NAMES[day_id]}\n'
        f'🏷️ {tags_str}\n'
        f'💬 {clean or "-"}\n\n'
        f'⏱ 30분 내 전송하면 자동 적용됩니다.\n'
        f'/clear 로 초기화'
    )


async def cmd_list(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if ALLOWED_USER_IDS and user.id not in ALLOWED_USER_IDS:
        return

    uploads = load_uploads()
    if not uploads:
        await update.message.reply_text('아직 업로드된 파일이 없습니다.')
        return

    by_day: dict[int, dict] = {}
    tag_counter: dict[str, int] = {}
    for u in uploads:
        d = u['dayId']
        by_day.setdefault(d, {'photo': 0, 'video': 0})
        by_day[d][u.get('type', 'photo')] += 1
        for t in u.get('tags', []):
            tag_counter[t] = tag_counter.get(t, 0) + 1

    lines = [f'📸 업로드 현황 (총 {len(uploads)}개)\n']
    for d in sorted(by_day):
        c = by_day[d]
        parts = []
        if c['photo']:
            parts.append(f'사진 {c["photo"]}장')
        if c['video']:
            parts.append(f'영상 {c["video"]}개')
        lines.append(f'  {d}일차 ({DAY_NAMES[d]}): {", ".join(parts)}')

    if tag_counter:
        top = sorted(tag_counter.items(), key=lambda x: -x[1])[:8]
        lines.append('\n🏷️ 태그: ' + '  '.join(f'#{t}({n})' for t, n in top))

    await update.message.reply_text('\n'.join(lines))


async def cmd_undo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if ALLOWED_USER_IDS and user.id not in ALLOWED_USER_IDS:
        return

    uploads = load_uploads()
    if not uploads:
        await update.message.reply_text('삭제할 파일이 없습니다.')
        return

    last = uploads.pop()
    save_uploads(uploads)

    file_path = PHOTOS_DIR / f'day{last["dayId"]}' / last['file']
    if file_path.exists():
        file_path.unlink()

    await update.message.reply_text(
        f'🗑️ 삭제 완료\n'
        f'{last["dayId"]}일차 · {last["file"]}\n'
        f'캡션: {last.get("caption") or "-"}'
    )


async def handle_media(update: Update, context: ContextTypes.DEFAULT_TYPE):
    import time
    user = update.effective_user
    if ALLOWED_USER_IDS and user.id not in ALLOWED_USER_IDS:
        await update.message.reply_text(f'⛔ 권한 없음 (ID: {user.id})')
        return

    msg = update.message
    gid = msg.media_group_id
    caption = msg.caption or ''
    # 안드로이드 Telegram이 영상/사진 전송 시 자동으로 붙이는 시스템 라벨 제거
    _SYSTEM_LABELS = {'동영상', '사진', '이미지', 'video', 'photo', 'image', 'gif'}
    if caption.strip().lower() in _SYSTEM_LABELS:
        caption = ''
    media_kind = 'photo' if msg.photo else ('video' if msg.video else 'document')
    logger.info(f'handle_media: user={user.id} kind={media_kind} gid={gid} caption={repr(caption)} has_pending={user.id in _pending_captions}')

    # 앨범: 첫 장의 캡션을 나머지에 공유
    if gid:
        if caption:
            _group_captions[gid] = caption
        else:
            caption = _group_captions.get(gid, '')

    if not caption:
        # 대기 캡션 확인 (텍스트 먼저 보낸 경우)
        pending = _pending_captions.get(user.id)
        if pending and pending['expires'] > time.time():
            caption = pending['caption']
            logger.info(f'handle_media: applying pending caption={repr(caption)}')
        else:
            if user.id in _pending_captions:
                del _pending_captions[user.id]
            if gid:
                if gid in _group_warned:
                    return
                _group_warned.add(gid)
            await msg.reply_text(
                '📝 캡션이 없어요!\n\n'
                '【방법 1】 텍스트 먼저 보내기\n'
                '  #2일차 #자연 벳푸 로프웨이\n'
                '  → 이후 사진/영상 전송\n\n'
                '【방법 2】 사진/영상에 캡션 달기\n'
                '  (재전송 시 길게 눌러 캡션 추가)\n'
                '  형식: #3일차 #가족 생신 파티 🎂'
            )
            return

    entry = await download_and_save(msg, context, caption)
    if entry:
        # 단일 사진이거나, 앨범의 첫 장(캡션 있는 장 또는 대기 캡션 첫 적용)에만 확인
        is_first = (not gid) or bool(msg.caption) or (gid and gid not in _group_warned)
        if is_first and gid:
            _group_warned.add(gid)  # 앨범 내 중복 알림 방지
        if is_first or not gid:
            uploads = load_uploads()
            day_count = sum(1 for u in uploads if u['dayId'] == entry['dayId'])
            tags_str = ' '.join(f'#{t}' for t in entry['tags']) or '없음'
            used_pending = not msg.caption and not _group_captions.get(gid or '')
            suffix = ' (대기 캡션 적용)' if used_pending else ''
            await msg.reply_text(
                f'✅ 저장!{suffix}\n'
                f'📅 {entry["dayId"]}일차 · {DAY_NAMES[entry["dayId"]]}\n'
                f'🏷️ {tags_str}\n'
                f'💬 {entry["caption"] or "-"}\n'
                f'📊 {entry["dayId"]}일차 누적 {day_count}개'
            )


def main():
    if not BOT_TOKEN:
        raise SystemExit('JAPAN_BOT_TOKEN이 .env에 없습니다.')

    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler('start', cmd_start))
    app.add_handler(CommandHandler('myid', cmd_start))
    app.add_handler(CommandHandler('list', cmd_list))
    app.add_handler(CommandHandler('undo', cmd_undo))
    app.add_handler(CommandHandler('clear', cmd_clear))
    app.add_handler(MessageHandler(
        filters.PHOTO | filters.VIDEO | filters.Document.ALL,
        handle_media,
    ))
    app.add_handler(MessageHandler(
        filters.TEXT & ~filters.COMMAND,
        handle_text,
    ))

    async def error_handler(update, context):
        logger.error(f'Unhandled exception: {context.error}', exc_info=context.error)
        if update and update.effective_message:
            try:
                await update.effective_message.reply_text(f'⚠️ 오류 발생: {context.error}')
            except Exception:
                pass

    app.add_error_handler(error_handler)
    logger.info('Japan photo bot started (polling)')
    app.run_polling(drop_pending_updates=True)


if __name__ == '__main__':
    main()
