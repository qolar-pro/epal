import sys, os, glob
sys.path.insert(0, '../bpylib')
from PIL import Image
src, dst = 'final', '/home/user/epal/review-cards-greece/assets/img'
os.makedirs(dst, exist_ok=True)
def save(im, path, q=84): im.convert('RGB').save(path, 'JPEG', quality=q, optimize=True, progressive=True)
n = 0
for f in sorted(glob.glob(src + '/*.png')):
    name = os.path.basename(f)[:-4]; im = Image.open(f)
    if name in ('hero', 'table'):
        save(im, f'{dst}/{name}-1800.jpg', 82); save(im.resize((900, 600), Image.LANCZOS), f'{dst}/{name}-900.jpg', 82)
    else:
        save(im, f'{dst}/{name}-900.jpg'); save(im.resize((450, 450), Image.LANCZOS), f'{dst}/{name}-450.jpg')
    n += 1
print('converted', n)
# Open Graph image from the hero render (1200x630 cover crop)
h = Image.open(src + '/hero.png'); w, hh = h.size; tw, th = 1200, 630; s = max(tw / w, th / hh); r = h.resize((int(w * s), int(hh * s)), Image.LANCZOS)
l, t = (r.width - tw) // 2, (r.height - th) // 2 - 20; r.crop((l, max(0, t), l + tw, max(0, t) + th)).convert('RGB').save('/home/user/epal/review-cards-greece/assets/og.png', optimize=True)
