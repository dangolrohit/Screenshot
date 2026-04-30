#!/usr/bin/env python3
"""Generate PNG icons for the Full Page Screenshot extension."""

import zlib
import struct
import math
import os


def make_png(size, get_pixel):
    """Build a valid RGBA PNG from a pixel callback get_pixel(x, y) -> (r,g,b,a)."""
    raw = bytearray()
    for y in range(size):
        raw.append(0)           # filter type: None
        for x in range(size):
            raw.extend(get_pixel(x, y))

    def chunk(tag, data):
        body = tag + data
        crc  = zlib.crc32(body) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + body + struct.pack('>I', crc)

    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    idat = chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    iend = chunk(b'IEND', b'')
    return b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend


def lerp(a, b, t):
    return int(a + (b - a) * max(0.0, min(1.0, t)))


def lerp_color(c1, c2, t):
    return tuple(lerp(c1[i], c2[i], t) for i in range(4))


def aa_alpha(dist, outer_r, width=1.5):
    """Return alpha 0-255 for anti-aliased circle edge."""
    if dist <= outer_r - width:
        return 255
    if dist >= outer_r:
        return 0
    return int((outer_r - dist) / width * 255)


def make_icon_pixel(size):
    """Return a get_pixel function that draws a camera-style icon."""
    s  = size / 48.0      # design is based on 48×48
    cx = size / 2.0
    cy = size / 2.0
    bg_r = size * 0.47

    # Palette
    BLUE_TOP = (26, 115, 232, 255)
    BLUE_BOT = (10,  55, 150, 255)
    WHITE    = (255, 255, 255, 255)
    DARK     = ( 12,  25,  60, 255)
    SHINE    = (160, 210, 255, 255)

    def pixel(x, y):
        px, py = x + 0.5, y + 0.5
        dx, dy = px - cx, py - cy
        dist   = math.sqrt(dx * dx + dy * dy)

        alpha = aa_alpha(dist, bg_r)
        if alpha == 0:
            return (0, 0, 0, 0)

        # Background gradient (top-left = light, bottom-right = dark)
        t_grad = (dx + dy + size) / (size * 2.0)
        bg = lerp_color(BLUE_TOP, BLUE_BOT, t_grad)

        # ── Camera body (rounded rect) ────────────────────────
        bw, bh = 28 * s, 18 * s
        bx1, by1 = cx - bw / 2, cy - bh / 2 + 2 * s
        bx2, by2 = cx + bw / 2, cy + bh / 2 + 2 * s
        br = 3 * s

        # ── Viewfinder bump ───────────────────────────────────
        vw, vh = 9 * s, 4 * s
        vx1, vy1 = cx - vw / 2, by1 - vh
        vx2, vy2 = cx + vw / 2, by1

        # ── Lens ──────────────────────────────────────────────
        lcx, lcy = cx, cy + 2 * s
        l_outer  = 7.5 * s
        l_ring   = 5.0 * s
        l_inner  = 3.0 * s
        l_shine  = 1.2 * s
        ldist    = math.sqrt((px - lcx) ** 2 + (py - lcy) ** 2)

        def in_rrect(qx, qy, x1, y1, x2, y2, r):
            if x1 + r <= qx <= x2 - r and y1 <= qy <= y2:
                return True
            if x1 <= qx <= x2 and y1 + r <= qy <= y2 - r:
                return True
            for (ccx, ccy) in [(x1+r, y1+r), (x2-r, y1+r), (x1+r, y2-r), (x2-r, y2-r)]:
                if math.sqrt((qx-ccx)**2 + (qy-ccy)**2) <= r:
                    return True
            return False

        in_body = in_rrect(px, py, bx1, by1, bx2, by2, br)
        in_bump = (vx1 <= px <= vx2 and vy1 <= py <= vy2)

        # Lens layers (front to back)
        if ldist <= l_shine:
            color = lerp_color(SHINE, WHITE, ldist / l_shine)
        elif ldist <= l_inner:
            color = DARK
        elif ldist <= l_ring:
            color = WHITE
        elif ldist <= l_outer:
            color = (bg[0], bg[1], bg[2], 255) if not (in_body or in_bump) else WHITE
        elif in_body or in_bump:
            color = WHITE
        else:
            color = (bg[0], bg[1], bg[2], 255)

        return (color[0], color[1], color[2], alpha)

    return pixel


def main():
    out_dir = os.path.join(os.path.dirname(__file__), 'icons')
    os.makedirs(out_dir, exist_ok=True)

    for size in (16, 48, 128):
        data  = make_png(size, make_icon_pixel(size))
        path  = os.path.join(out_dir, f'icon{size}.png')
        with open(path, 'wb') as f:
            f.write(data)
        print(f'  Created {path}  ({size}×{size}, {len(data):,} bytes)')

    print('Icons generated successfully.')


if __name__ == '__main__':
    main()
