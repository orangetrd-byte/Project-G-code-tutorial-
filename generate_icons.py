#!/usr/bin/env python3
"""
Project G-Code Tutorial — Icon Generator
Generates 192x192 and 512x512 PNG icons using only stdlib.
Run: python3 generate_icons.py
"""

import struct, zlib, os

def make_png(size, bg=(15,25,35), fg=(245,166,35)):
    """Generate a minimal PNG with the [G] logo mark."""
    # Build pixel data
    px = []
    cx, cy = size // 2, size // 2
    pad = size // 8

    for y in range(size):
        row = []
        for x in range(size):
            # Rounded square background
            r = size // 6
            in_rect = (pad <= x < size-pad) and (pad <= y < size-pad)
            # Simple bracket + G letterform at center
            rel_x = (x - cx) / (size * 0.28)
            rel_y = (y - cy) / (size * 0.35)

            # Left bracket [
            is_bracket_left = (
                (-1.1 < rel_x < -0.65) and (-1.1 < rel_y < 1.1) and
                (abs(rel_y) > 0.8 or rel_x < -0.9)
            )
            # Right bracket ]
            is_bracket_right = (
                (0.65 < rel_x < 1.1) and (-1.1 < rel_y < 1.1) and
                (abs(rel_y) > 0.8 or rel_x > 0.9)
            )
            # Letter G
            dist_from_circle = abs(((rel_x)**2 + (rel_y)**2)**0.5 - 0.6)
            in_G_ring = dist_from_circle < 0.12 and not (rel_x > 0.3 and -0.15 < rel_y < 0.15)
            in_G_bar  = (0.25 < rel_x < 0.6) and (-0.05 < rel_y < 0.2)

            if in_rect and (is_bracket_left or is_bracket_right or in_G_ring or in_G_bar):
                row.extend(fg)
            elif in_rect:
                row.extend(bg)
            else:
                # Dark bg outside rounded rect area
                outer = tuple(max(0, c - 8) for c in bg)
                row.extend(outer)
        px.append(row)

    # Encode PNG
    def write_chunk(tag, data):
        c = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', c)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    idat_raw = b''.join(b'\x00' + bytes(row) for row in px)
    idat = zlib.compress(idat_raw, 9)

    return (
        b'\x89PNG\r\n\x1a\n' +
        write_chunk(b'IHDR', ihdr) +
        write_chunk(b'IDAT', idat) +
        write_chunk(b'IEND', b'')
    )

os.makedirs('icons', exist_ok=True)
for sz in [192, 512]:
    path = f'icons/icon-{sz}.png'
    data = make_png(sz)
    with open(path, 'wb') as f:
        f.write(data)
    print(f'Generated {path} ({len(data)} bytes)')

print('Icons generated. Place the icons/ folder next to index.html.')
