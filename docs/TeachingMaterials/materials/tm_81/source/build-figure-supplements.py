"""Build the 2026-10-27 附圖段考型補充題庫 (tm_80 數學選填、tm_81 生物、tm_82 地球科學).
Every numeric answer is checked here and every figure is drawn here as SVG
before anything is written. Usage: python3 build-figure-supplements.py <repo-root>"""
import json, math, os, sys

ROOT = sys.argv[1]
MAT = os.path.join(ROOT, "docs/TeachingMaterials/materials")
DATE = "2026-10-27T00:00:00Z"
L = "ABCDEFG"
FIGS = {}

def close(a, b, tol=1e-9):
    assert abs(a - b) <= tol * max(1, abs(b)), (a, b)

def svg(name, w, h, body):
    FIGS[name] = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
                  'font-family="sans-serif" font-size="14">\n<rect width="%d" height="%d" fill="#fff"/>\n%s\n</svg>\n') % (w, h, w, h, w, h, body)
    return name

def S(stem, opts, ans, expl, kp, section, page, fig=None, diff="中"):
    assert ans in opts and len(set(opts)) == len(opts), stem
    return dict(type="single_choice", question=stem, options=opts, answer=ans, explanation=expl, knowledgePoint=kp, section=section, page=page, difficulty=diff, fig=fig)

def M(stem, opts, letters, expl, kp, section, page, fig=None, diff="中"):
    assert all(c in L[:len(opts)] for c in letters)
    return dict(type="single_choice", question="【多選題】" + stem, options=["(%s) %s" % (L[i], o) for i, o in enumerate(opts)],
                answer="".join("(%s)" % c for c in letters), explanation=expl, knowledgePoint=kp, section=section, page=page, difficulty=diff, fig=fig)

def F(stem, ans, expl, kp, section, page, fig=None, diff="中"):
    return dict(type="calculation", question="【選填題】" + stem, options=[], answer=ans, explanation=expl, knowledgePoint=kp, section=section, page=page, difficulty=diff, fig=fig)

def curve(f, x0, x1, X, Y, n=240):
    pts = [(X(x0 + (x1 - x0) * i / n), Y(f(x0 + (x1 - x0) * i / n))) for i in range(n + 1)]
    return '<polyline fill="none" stroke="#1565c0" stroke-width="2.2" points="%s"/>' % " ".join("%.1f,%.1f" % p for p in pts)

def axes(x0, x1, y0, y1, ox, oy):
    return ('<g stroke="#333" stroke-width="1.2"><line x1="%d" y1="%d" x2="%d" y2="%d"/><line x1="%d" y1="%d" x2="%d" y2="%d"/></g>'
            '<polygon points="%d,%d %d,%d %d,%d" fill="#333"/><polygon points="%d,%d %d,%d %d,%d" fill="#333"/>'
            '<text x="%d" y="%d">x</text><text x="%d" y="%d">y</text><text x="%d" y="%d">O</text>') % (
        x0, oy, x1, oy, ox, y0, ox, y1, x1, oy, x1 - 8, oy - 4, x1 - 8, oy + 4, ox, y0, ox - 4, y0 + 8, ox + 4, y0 + 8,
        x1 - 4, oy + 18, ox + 8, y0 + 12, ox - 14, oy - 4)

# ================================================================ tm_80 數學 第1章 選填（附圖）
S1, S2, S3, S4 = "1-1 弧度量", "1-2 三角函數的圖形", "1-3 三角的和角與差角公式", "1-4 正餘弦函數的疊合"
m = []

# 1 由圖形求 a、b、k
f1 = lambda x: 3 * math.sin(2 * x) + 2
close(f1(math.pi / 4), 5); close(f1(3 * math.pi / 4), -1)
X = lambda x: 50 + x / math.pi * 320; Y = lambda y: 150 - y * 20
body = axes(20, 400, 20, 190, 50, 150) + curve(f1, 0, math.pi, X, Y)
body += '<g stroke="#999" stroke-dasharray="4 3"><line x1="50" y1="%.1f" x2="%.1f" y2="%.1f"/><line x1="%.1f" y1="%.1f" x2="%.1f" y2="150"/><line x1="50" y1="%.1f" x2="%.1f" y2="%.1f"/><line x1="%.1f" y1="150" x2="%.1f" y2="%.1f"/></g>' % (
    Y(5), X(math.pi / 4), Y(5), X(math.pi / 4), Y(5), X(math.pi / 4), Y(-1), X(3 * math.pi / 4), Y(-1), X(3 * math.pi / 4), X(3 * math.pi / 4), Y(-1))
body += '<text x="26" y="%.1f">5</text><text x="20" y="%.1f">−1</text><text x="%.1f" y="168">π/4</text><text x="%.1f" y="168">3π/4</text><text x="%.1f" y="168">π</text>' % (
    Y(5) + 5, Y(-1) + 5, X(math.pi / 4) - 12, X(3 * math.pi / 4) - 16, X(math.pi) - 4)
body += '<text x="250" y="40">y = a sin(bx) + k</text>'
m.append(F("右圖為 y = a sin(bx) + k（a > 0，b > 0）在 0 ≤ x ≤ π 的圖形，最高點為 (π/4, 5)，最低點為 (3π/4, −1)。則 a = ⑴，b = ⑵，k = ⑶。",
  "(1) 3；(2) 2；(3) 2",
  "a = (5 − (−1)) ÷ 2 = 3；k = (5 + (−1)) ÷ 2 = 2。最高點到相鄰最低點是半個週期：3π/4 − π/4 = π/2 ⇒ 週期 π ⇒ b = 2π/π = 2。驗算：x = π/4 時 3sin(π/2) + 2 = 5。",
  "由圖形求正弦函數", S2, 26, svg("tm_80_q1.svg", 420, 200, body)))

# 2 扇形弧長與面積
r, th = 6, 2 * math.pi / 3
close(r * th, 4 * math.pi); close(0.5 * r * r * th, 12 * math.pi)
cx, cy, R = 160, 170, 120
a0, a1 = math.radians(-30), math.radians(-150)
p0 = (cx + R * math.cos(a0), cy + R * math.sin(a0)); p1 = (cx + R * math.cos(a1), cy + R * math.sin(a1))
body = '<path d="M%d,%d L%.1f,%.1f A%d,%d 0 0 0 %.1f,%.1f Z" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/>' % (cx, cy, p0[0], p0[1], R, R, p1[0], p1[1])
body += '<path d="M%.1f,%.1f A26,26 0 0 0 %.1f,%.1f" fill="none" stroke="#333"/>' % (cx + 26 * math.cos(a0), cy + 26 * math.sin(a0), cx + 26 * math.cos(a1), cy + 26 * math.sin(a1))
body += '<text x="%d" y="%d">O</text><text x="%d" y="%d">2π/3</text><text x="%.1f" y="%.1f">6</text><text x="%.1f" y="%.1f">A</text><text x="%.1f" y="%.1f">B</text>' % (
    cx - 5, cy + 20, cx - 16, cy - 32, (cx + p0[0]) / 2 + 6, (cy + p0[1]) / 2 + 16, p0[0] + 6, p0[1] + 4, p1[0] - 16, p1[1] + 4)
m.append(F("如圖，扇形 OAB 的半徑為 6，圓心角 ∠AOB = 2π/3。則弧 AB 的長為 ⑴，扇形 OAB 的面積為 ⑵。（答案以 π 表示）",
  "(1) 4π；(2) 12π",
  "弧長 s = rθ = 6 × 2π/3 = 4π；面積 = ½r²θ = ½ × 36 × 2π/3 = 12π（也可用 ½rs = ½ × 6 × 4π）。",
  "扇形面積與弧長", S1, 6, svg("tm_80_q2.svg", 320, 200, body), "易"))

# 3 由圖形求差角的正切
tA = math.atan(3 / 3); tD = math.atan(1 / 3); close(math.tan(tA - tD), 0.5)
body = '<polygon points="60,40 60,220 330,220" fill="#fff8e1" stroke="#333" stroke-width="2"/><line x1="60" y1="40" x2="150" y2="220" stroke="#c62828" stroke-width="2"/>'
body += '<polyline points="60,204 76,204 76,220" fill="none" stroke="#333"/>'
body += '<text x="44" y="36">A</text><text x="44" y="236">C</text><text x="146" y="238">D</text><text x="330" y="238">B</text>'
body += '<text x="38" y="135">3</text><text x="100" y="238">1</text><text x="236" y="238">2</text>'
m.append(F("如圖，△ABC 中 ∠C = 90°，AC = 3，D 在 BC 上，CD = 1、DB = 2。則 tan∠DAB = ⑴。（以最簡分數表示）",
  "1/2",
  "tan∠CAB = CB/AC = 3/3 = 1，tan∠CAD = CD/AC = 1/3。∠DAB = ∠CAB − ∠CAD，由差角公式 tan∠DAB = (1 − 1/3) ÷ (1 + 1 × 1/3) = (2/3) ÷ (4/3) = 1/2。",
  "正切差角公式", S3, 44, svg("tm_80_q3.svg", 360, 250, body)))

# 4 單位圓上的點 → 二倍角
s, c = 4 / 5, -3 / 5
close(2 * s * c, -24 / 25); close(c * c - s * s, -7 / 25)
X = lambda x: 180 + x * 110; Y = lambda y: 140 - y * 110
body = '<circle cx="180" cy="140" r="110" fill="none" stroke="#1565c0" stroke-width="2"/>' + axes(50, 310, 15, 265, 180, 140)
body += '<line x1="180" y1="140" x2="%.1f" y2="%.1f" stroke="#c62828" stroke-width="2"/><circle cx="%.1f" cy="%.1f" r="4" fill="#c62828"/>' % (X(c), Y(s), X(c), Y(s))
body += '<path d="M206,140 A26,26 0 0 0 %.1f,%.1f" fill="none" stroke="#333"/><text x="198" y="122">θ</text>' % (180 + 26 * c, 140 - 26 * s)
body += '<text x="%.1f" y="%.1f">P(−3/5, 4/5)</text>' % (X(c) - 70, Y(s) - 10)
m.append(F("如圖，角 θ 的終邊與單位圓交於點 P(−3/5, 4/5)。則 sin 2θ = ⑴，cos 2θ = ⑵。（以最簡分數表示）",
  "(1) −24/25；(2) −7/25",
  "sin θ = 4/5、cos θ = −3/5。sin 2θ = 2sin θ cos θ = 2 × (4/5) × (−3/5) = −24/25；cos 2θ = cos²θ − sin²θ = 9/25 − 16/25 = −7/25。",
  "二倍角公式與單位圓", S3, 48, svg("tm_80_q4.svg", 330, 280, body)))

# 5 半圓上的點：疊合求最大值
best = max(10 * math.cos(t) + 10 * math.sin(t) for t in [i / 10000 * math.pi / 2 for i in range(10001)])
close(best, 10 * math.sqrt(2), 1e-6)
cx, cy, R = 180, 200, 140
t = math.radians(40); P = (cx + R * math.cos(math.pi - 2 * t), cy - R * math.sin(math.pi - 2 * t))
body = '<path d="M40,200 A140,140 0 0 1 320,200 Z" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>'
body += '<polyline points="40,200 %.1f,%.1f 320,200" fill="none" stroke="#c62828" stroke-width="2"/>' % P
body += '<text x="24" y="218">A</text><text x="322" y="218">B</text><text x="176" y="218">O</text><text x="%.1f" y="%.1f">P</text><text x="62" y="194">θ</text>' % (P[0] - 4, P[1] - 8)
m.append(F("如圖，AB 為半圓的直徑，AB = 10，P 為半圓上異於 A、B 的一點，∠PAB = θ。則 PA + PB 的最大值為 ⑴。（以最簡根式表示）",
  "10√2",
  "直徑所對的圓周角為直角：PA = 10cos θ、PB = 10sin θ。PA + PB = 10(sin θ + cos θ) = 10√2 sin(θ + π/4) ≤ 10√2，θ = π/4 時成立。",
  "疊合的幾何應用：限定區間求極值", S4, 60, svg("tm_80_q5.svg", 360, 230, body), "難"))

# 6 摩天輪：週期模型
h = lambda t: 25 - 20 * math.cos(math.pi * t / 6)
close(h(0), 5); close(h(6), 45); close(h(4), 35)
body = '<circle cx="150" cy="120" r="90" fill="none" stroke="#6a1b9a" stroke-width="2"/><line x1="20" y1="230" x2="300" y2="230" stroke="#333" stroke-width="2"/>'
body += '<line x1="150" y1="120" x2="110" y2="230" stroke="#333"/><line x1="150" y1="120" x2="190" y2="230" stroke="#333"/>'
body += '<line x1="150" y1="120" x2="150" y2="210" stroke="#c62828" stroke-dasharray="4 3"/><circle cx="150" cy="210" r="5" fill="#c62828"/><circle cx="150" cy="120" r="3" fill="#333"/>'
body += '<line x1="260" y1="120" x2="260" y2="230" stroke="#999"/><text x="266" y="180">25 m</text><text x="156" y="170">20 m</text><text x="196" y="208">起點（最低點）</text>'
m.append(F("如圖，摩天輪的半徑 20 公尺，中心離地 25 公尺，每 12 分鐘等速轉一圈。小明從最低點上車，則他離地的最大高度為 ⑴ 公尺；上車 4 分鐘後離地 ⑵ 公尺。",
  "(1) 45 公尺；(2) 35 公尺",
  "離地高度 h(t) = 25 − 20cos(2πt/12) = 25 − 20cos(πt/6)。最大值 25 + 20 = 45 公尺。t = 4：h = 25 − 20cos(2π/3) = 25 + 10 = 35 公尺。",
  "正弦函數模型：摩天輪", S2, 36, svg("tm_80_q6.svg", 320, 245, body)))

# 7 由圖形讀週期與振幅
f7 = lambda x: 2 * math.cos(x / 2)
close(f7(0), 2); close(f7(2 * math.pi), -2); close(f7(4 * math.pi), 2)
X = lambda x: 40 + x / (4 * math.pi) * 340; Y = lambda y: 120 - y * 40
body = axes(20, 400, 15, 225, 40, 120) + curve(f7, 0, 4 * math.pi, X, Y)
body += '<text x="%.1f" y="138">2π</text><text x="%.1f" y="138">4π</text><text x="18" y="%.1f">2</text><text x="12" y="%.1f">−2</text>' % (X(2 * math.pi) - 8, X(4 * math.pi) - 10, Y(2) + 5, Y(-2) + 5)
body += '<g stroke="#999" stroke-dasharray="4 3"><line x1="40" y1="%.1f" x2="%.1f" y2="%.1f"/><line x1="%.1f" y1="120" x2="%.1f" y2="%.1f"/></g>' % (Y(-2), X(2 * math.pi), Y(-2), X(2 * math.pi), X(2 * math.pi), Y(-2))
m.append(F("右圖為 y = a cos(bx)（a > 0，b > 0）的部分圖形，圖形通過 (0, 2)、(2π, −2)、(4π, 2)，且 x = 2π 為第一個最低點。則 a = ⑴，b = ⑵。（以最簡分數表示）",
  "(1) 2；(2) 1/2",
  "振幅 a = 2。由最高點 (0, 2) 到下一個最高點 (4π, 2) 為一個週期 4π ⇒ b = 2π ÷ 4π = 1/2，即 y = 2cos(x/2)。",
  "由圖形求週期與振幅", S2, 26, svg("tm_80_q7.svg", 420, 240, body)))

# 8–12 不附圖的選填
close(math.sin(math.pi / 12) * math.cos(math.pi / 12), 0.25)
m.append(F("sin 15° cos 15° 的值為 ⑴。（以最簡分數表示）", "1/4",
  "sin 15° cos 15° = ½ sin 30° = ½ × ½ = 1/4。", "二倍角公式求值", S3, 48, None, "易"))
close(math.cos(math.pi / 8) ** 2 - math.sin(math.pi / 8) ** 2, math.sqrt(2) / 2)
m.append(F("cos²(π/8) − sin²(π/8) 的值為 ⑴。（以最簡根式表示）", "√2/2",
  "由二倍角 cos 2θ = cos²θ − sin²θ，原式 = cos(π/4) = √2/2。", "二倍角公式求值", S3, 48, None, "易"))
roots = sorted({round(x, 9) for k in range(-2, 6) for x in (math.pi / 12 + k * math.pi, 5 * math.pi / 12 + k * math.pi) if 0 <= x < 2 * math.pi})
assert len(roots) == 4 and all(abs(2 * math.sin(2 * x) - 1) < 1e-6 for x in roots)
m.append(F("在 0 ≤ x < 2π 內，方程式 2sin 2x = 1 共有 ⑴ 個解。", "4",
  "sin 2x = 1/2，且 0 ≤ 2x < 4π ⇒ 2x = π/6、5π/6、13π/6、17π/6，共 4 個 ⇒ x = π/12、5π/12、13π/12、17π/12。", "三角方程式解的個數", S2, 30))
close(12 * (20 / 60) * 2 * math.pi, 8 * math.pi)
m.append(F("時鐘的分針長 12 公分，經過 20 分鐘，分針尖端走過的弧長為 ⑴ 公分。（以 π 表示）", "8π 公分",
  "20 分鐘轉 1/3 圈，圓心角 2π/3。弧長 = rθ = 12 × 2π/3 = 8π 公分。", "弧長公式的應用", S1, 6, None, "易"))
g = lambda x: 3 * math.sin(x) + 4 * math.cos(x)
xs = [i / 20000 * 2 * math.pi for i in range(20001)]
close(max(map(g, xs)), 5, 1e-6); close(min(map(g, xs)), -5, 1e-6)
m.append(F("函數 f(x) = 3sin x + 4cos x 的最大值為 ⑴，最小值為 ⑵。", "(1) 5；(2) −5",
  "3sin x + 4cos x = 5sin(x + θ)（cos θ = 3/5、sin θ = 4/5），值域為 [−5, 5]。", "疊合求最大值與最小值", S4, 58, None, "易"))

# ================================================================ tm_81 生物 第2章（附圖）
B1, B2 = "2-1 植物體的組成與體制", "2-2 植物體的根莖葉"
b = []
LBL = lambda x, y, t: '<text x="%d" y="%d" font-weight="bold">%s</text>' % (x, y, t)
def arrow(x1, y1, x2, y2):
    return '<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="#333"/><circle cx="%d" cy="%d" r="2.5" fill="#333"/>' % (x1, y1, x2, y2, x2, y2)

# 根尖縱切
body = '<path d="M90,20 L90,250 Q90,290 120,300 Q150,290 150,250 L150,20 Z" fill="#f1f8e9" stroke="#33691e" stroke-width="2"/>'
body += '<path d="M90,262 Q92,296 120,306 Q148,296 150,262 Z" fill="#ffe0b2" stroke="#e65100"/>'
body += "".join('<line x1="90" y1="%d" x2="%d" y2="%d" stroke="#33691e"/><line x1="150" y1="%d" x2="%d" y2="%d" stroke="#33691e"/>' % (y, 60, y - 6, y, 180, y - 6) for y in range(40, 110, 14))
for y in (120, 200, 250):
    body += '<line x1="90" y1="%d" x2="150" y2="%d" stroke="#999" stroke-dasharray="3 3"/>' % (y, y)
body += "".join('<rect x="%d" y="%d" width="9" height="9" fill="none" stroke="#7cb342"/>' % (x, y) for x in range(96, 145, 10) for y in range(206, 246, 10))
body += "".join('<rect x="%d" y="%d" width="9" height="20" fill="none" stroke="#7cb342"/>' % (x, y) for x in range(96, 145, 10) for y in (128, 152, 176))
body += arrow(200, 70, 150, 70) + LBL(206, 75, "甲") + arrow(200, 160, 150, 160) + LBL(206, 165, "乙") + arrow(200, 226, 150, 226) + LBL(206, 231, "丙") + arrow(200, 290, 140, 290) + LBL(206, 295, "丁")
fig_root = svg("tm_81_q1.svg", 250, 320, body)
b.append(S("右圖為植物根尖縱切面的示意圖，甲～丁為不同區域。細胞分裂最旺盛的是哪一區？", ["甲", "乙", "丙", "丁"], "丙",
  "由下往上：丁為根冠（保護生長點）、丙為生長點（頂端分生組織，細胞小、排列緊密、分裂旺盛）、乙為延長區（細胞縱向伸長）、甲為成熟區（有根毛）。", "根尖的分區：生長點", B1, 38, fig_root, "易"))
b.append(S("承上圖，根吸收水分與礦物質最主要的部位是哪一區？", ["甲", "乙", "丙", "丁"], "甲",
  "甲為成熟區（根毛區）：表皮細胞向外突出形成根毛，大幅增加吸收表面積，是吸收水分與礦物質的主要部位。", "根尖的分區：根毛", B1, 38, fig_root, "易"))
b.append(M("承上圖，下列有關根尖各區的敘述，哪些正確？（應選 2 項）",
  ["丁可保護生長點，並可分泌黏液利於根向下伸入土壤", "乙的細胞主要以細胞分裂增加數目，使根變長", "甲的根毛是由多個細胞組成的構造", "丙屬於分生組織", "根的初生木質部最早在丙區分化完成"], "AD",
  "(A) 根冠保護生長點並分泌黏液。(B) 延長區主要靠細胞伸長使根變長。(C) 根毛是單一表皮細胞的突起。(D) 生長點是頂端分生組織。(E) 維管組織在成熟區才分化完成。", "根尖分區的功能", B1, 38, fig_root))

# 雙子葉莖的維管束
body = '<circle cx="150" cy="150" r="130" fill="#f9fbe7" stroke="#33691e" stroke-width="2"/>'
for k in range(8):
    a = k * math.pi / 4
    x, y = 150 + 88 * math.cos(a), 150 + 88 * math.sin(a)
    body += '<g transform="translate(%.1f,%.1f) rotate(%.1f)"><ellipse cx="9" cy="0" rx="12" ry="14" fill="#c8e6c9" stroke="#2e7d32"/><ellipse cx="-11" cy="0" rx="10" ry="14" fill="#ffcdd2" stroke="#c62828"/></g>' % (x, y, math.degrees(a))
body += '<circle cx="150" cy="150" r="88" fill="none" stroke="#f9a825" stroke-width="2" stroke-dasharray="5 3"/>'
body += arrow(320, 150, 250, 150) + LBL(326, 155, "甲") + arrow(320, 190, 238, 150) + LBL(326, 195, "乙") + arrow(320, 230, 227, 158) + LBL(326, 235, "丙")
body += '<text x="20" y="296" font-size="12">（外側：甲；虛線：乙；內側：丙）</text>'
fig_stem = svg("tm_81_q4.svg", 360, 305, body)
b.append(S("右圖為雙子葉植物莖的橫切面示意圖，甲、乙、丙為維管束的三個部分。運輸葉片製造的葡萄糖等有機養分的是：", ["甲", "乙", "丙", "甲和丙都可以"], "甲",
  "維管束由外而內為：甲 韌皮部（運輸有機養分）、乙 維管束形成層、丙 木質部（運輸水分與礦物質）。", "維管束：韌皮部與木質部的位置", B2, 46, fig_stem, "易"))
b.append(M("承上圖，下列敘述哪些正確？（應選 3 項）",
  ["乙為分生組織，可向內產生次生木質部、向外產生次生韌皮部", "丙中的導管與管胞成熟時為死細胞", "甲中的篩管細胞成熟時沒有細胞核", "單子葉植物莖的維管束也都具有乙", "丙位於靠近表皮的一側"], "ABC",
  "(A) 維管束形成層向內產生次生木質部、向外產生次生韌皮部，使莖加粗。(B) 導管、管胞成熟時原生質消失，為死細胞。(C) 篩管細胞成熟時細胞核消失，由伴細胞協助。(D) 單子葉植物莖的維管束通常沒有形成層。(E) 木質部在內側，韌皮部在外側。", "維管束與形成層", B2, 46, fig_stem))

# 單子葉／雙子葉莖
body = '<circle cx="90" cy="100" r="75" fill="#f9fbe7" stroke="#33691e" stroke-width="2"/><circle cx="270" cy="100" r="75" fill="#f9fbe7" stroke="#33691e" stroke-width="2"/>'
import random
rnd = random.Random(7)
pts = []
while len(pts) < 22:
    x, y = rnd.uniform(-62, 62), rnd.uniform(-62, 62)
    if x * x + y * y < 62 * 62 and all((x - p) ** 2 + (y - q) ** 2 > 230 for p, q in pts):
        pts.append((x, y))
body += "".join('<ellipse cx="%.1f" cy="%.1f" rx="5" ry="6.5" fill="#c8e6c9" stroke="#2e7d32"/>' % (90 + x, 100 + y) for x, y in pts)
body += "".join('<ellipse cx="%.1f" cy="%.1f" rx="7" ry="9" fill="#c8e6c9" stroke="#2e7d32"/>' % (270 + 50 * math.cos(k * math.pi / 5), 100 + 50 * math.sin(k * math.pi / 5)) for k in range(10))
body += LBL(84, 200, "甲") + LBL(264, 200, "乙")
fig_mono = svg("tm_81_q6.svg", 360, 210, body)
b.append(S("右圖甲、乙為兩種植物莖的橫切面示意圖（綠色為維管束）。下列敘述何者正確？",
  ["甲為單子葉植物的莖，維管束散生", "乙的維管束沒有形成層", "甲可形成明顯的年輪", "乙可能是玉米的莖"], "甲為單子葉植物的莖，維管束散生",
  "甲的維管束散生，為單子葉植物（如玉米、竹）；乙的維管束排成環狀，為雙子葉植物，具形成層，木本者可形成年輪。", "單子葉與雙子葉植物莖的比較", B2, 44, fig_mono, "易"))

# 葉橫切
body = '<rect x="20" y="20" width="320" height="16" fill="#e3f2fd" stroke="#1565c0"/>'
body += "".join('<rect x="%d" y="40" width="16" height="56" rx="6" fill="#c8e6c9" stroke="#2e7d32"/>' % x for x in range(22, 336, 20))
body += "".join('<circle cx="%d" cy="%d" r="11" fill="#e8f5e9" stroke="#2e7d32"/>' % (x, y) for x, y in [(40, 118), (78, 130), (120, 114), (160, 136), (200, 118), (246, 132), (290, 116), (322, 136)])
body += '<rect x="20" y="152" width="320" height="16" fill="#e3f2fd" stroke="#1565c0"/>'
body += '<ellipse cx="180" cy="160" rx="7" ry="8" fill="#a5d6a7" stroke="#2e7d32"/><ellipse cx="196" cy="160" rx="7" ry="8" fill="#a5d6a7" stroke="#2e7d32"/>'
body += arrow(360, 28, 340, 28) + LBL(364, 33, "甲") + arrow(360, 68, 336, 68) + LBL(364, 73, "乙") + arrow(360, 124, 334, 130) + LBL(364, 129, "丙") + arrow(240, 192, 196, 166) + LBL(244, 198, "丁")
fig_leaf = svg("tm_81_q7.svg", 400, 210, body)
b.append(S("右圖為一般雙子葉植物葉片的橫切面示意圖。葉綠體數量最多、為光合作用主要場所的是：", ["甲", "乙", "丙", "丁"], "乙",
  "甲 上表皮（細胞多無葉綠體）、乙 柵狀組織（細胞長柱形、排列緊密、葉綠體最多）、丙 海綿組織（排列疏鬆、有大量細胞間隙）、丁 下表皮的保衛細胞與氣孔。", "葉的構造：柵狀組織", B2, 52, fig_leaf, "易"))
b.append(M("承上圖，下列敘述哪些正確？（應選 2 項）",
  ["丁由一對保衛細胞圍成，可控制氣體進出", "丙的細胞間隙有利於氣體擴散", "甲的細胞含大量葉綠體", "一般陸生雙子葉植物的氣孔多分布在上表皮", "乙和丙合稱為維管束"], "AB",
  "(A) 保衛細胞改變形狀控制氣孔開閉。(B) 海綿組織排列疏鬆，利於 CO₂、O₂、水蒸氣擴散。(C) 表皮細胞多不含葉綠體（保衛細胞例外）。(D) 一般陸生植物氣孔多在下表皮，可減少水分散失。(E) 乙、丙合稱葉肉。", "葉的構造：氣孔與葉肉", B2, 52, fig_leaf))

# 木本莖
body = '<circle cx="140" cy="130" r="115" fill="#8d6e63" stroke="#4e342e" stroke-width="2"/><circle cx="140" cy="130" r="103" fill="#ffe0b2"/>'
body += "".join('<circle cx="140" cy="130" r="%d" fill="none" stroke="#d7a86e"/>' % r for r in (90, 78, 66))
body += '<circle cx="140" cy="130" r="56" fill="#a1887f"/>' + "".join('<circle cx="140" cy="130" r="%d" fill="none" stroke="#795548"/>' % r for r in (44, 32, 20))
body += arrow(300, 40, 230, 60) + LBL(306, 45, "甲") + arrow(300, 100, 225, 110) + LBL(306, 105, "乙") + arrow(300, 170, 180, 150) + LBL(306, 175, "丙")
fig_wood = svg("tm_81_q9.svg", 340, 260, body)
b.append(S("右圖為木本植物莖的橫切面示意圖，甲為最外層，乙為顏色較淺的外圈木材，丙為顏色較深的中心木材。仍具有運輸水分功能的是：", ["甲", "乙", "丙", "乙和丙都可以"], "乙",
  "甲為樹皮（含韌皮部與周皮）；乙為邊材，是較新的木質部，仍可運輸水分；丙為心材，導管被樹脂等物質堵塞，不再運輸，只有支持功能。", "木本莖：心材與邊材", B2, 48, fig_wood, "易"))

# 根的橫切與卡氏帶
body = '<circle cx="150" cy="140" r="125" fill="#f1f8e9" stroke="#33691e" stroke-width="2"/><circle cx="150" cy="140" r="58" fill="#fffde7" stroke="#f57f17" stroke-width="3" stroke-dasharray="6 3"/>'
body += '<polygon points="150,100 162,128 192,130 168,148 176,178 150,160 124,178 132,148 108,130 138,128" fill="#c8e6c9" stroke="#2e7d32"/>'
body += '<path d="M28,120 C70,110 70,150 92,140" fill="none" stroke="#1565c0" stroke-width="2.5" marker-end="url(#ah)"/>'
body += '<defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#1565c0"/></marker></defs>'
body += arrow(300, 80, 205, 115) + LBL(306, 85, "甲") + arrow(300, 140, 175, 145) + LBL(306, 145, "乙") + '<text x="20" y="104" font-size="12" fill="#1565c0">水</text>'
fig_cas = svg("tm_81_q10.svg", 340, 280, body)
b.append(S("右圖為根的橫切面示意圖，虛線環甲為內皮，乙為中央的維管組織。水分沿細胞壁與細胞間隙（質外體途徑）移動到甲時無法繼續通過，必須進入細胞內，主要原因是甲具有：",
  ["卡氏帶", "角質層", "根毛", "篩板"], "卡氏帶",
  "內皮細胞的徑向壁與橫向壁有木質化與栓質化的卡氏帶，阻斷質外體途徑，水與礦物質必須穿過細胞膜（共質體途徑），植物因此能選擇吸收的物質。", "根的構造：內皮與卡氏帶", B2, 42, fig_cas))

# ================================================================ tm_82 地球科學（附圖）
E1, E3 = "主題2 相對地質年代與絕對地質年代", "主題6 宇宙結構與宇宙膨脹"
e = []

# 化石分布表
ranges = {"甲": (1, 3), "乙": (2, 5), "丙": (3, 6), "丁": (5, 5)}
both = [k for k in range(1, 7) if ranges["甲"][0] <= k <= ranges["甲"][1] and ranges["丙"][0] <= k <= ranges["丙"][1]]
assert both == [3]
shortest = min(ranges, key=lambda f: ranges[f][1] - ranges[f][0]); assert shortest == "丁"
Yl = lambda k: 250 - k * 36
body = "".join('<rect x="60" y="%d" width="260" height="36" fill="%s" stroke="#999"/><text x="20" y="%d">%d</text>' % (Yl(k), "#fafafa" if k % 2 else "#f0f0f0", Yl(k) + 23, k) for k in range(1, 7))
for i, (name, (lo, hi)) in enumerate(ranges.items()):
    x = 100 + i * 60
    body += '<rect x="%d" y="%d" width="16" height="%d" rx="4" fill="#6d4c41"/>' % (x, Yl(hi) + 6, (hi - lo + 1) * 36 - 12)
    body += '<text x="%d" y="268" font-weight="bold">%s</text>' % (x, name)
body += '<text x="4" y="20" font-size="12">地層（1 最老）</text><text x="190" y="290" font-size="12">化石</text>'
fig_fossil = svg("tm_82_q1.svg", 340, 300, body)
e.append(S("右圖為某地區地層 1～6 中化石甲～丁的分布（地層未倒轉，1 最老）。若在另一地區的岩層中同時發現化石甲與丙，則此岩層最可能與哪一層同時代？",
  ["第 2 層", "第 3 層", "第 4 層", "第 5 層"], "第 3 層",
  "甲只出現在第 1～3 層，丙只出現在第 3～6 層，兩者共存的範圍只有第 3 層（化石共存區間）。", "化石對比：共存區間", E1, 10, fig_fossil))
e.append(S("承上圖，若甲～丁在各地的分布都很廣，最適合作為標準化石的是：", ["甲", "乙", "丙", "丁"], "丁",
  "標準化石須生存時間短、分布廣、數量多、特徵明顯。丁只出現在第 5 層，生存時間最短，最能精確指出地層的年代。", "標準化石的條件", E1, 10, fig_fossil, "易"))

# 地質剖面：疊置、截切
body = '<rect x="20" y="170" width="320" height="60" fill="#d7ccc8" stroke="#5d4037"/><rect x="20" y="110" width="320" height="60" fill="#ffe0b2" stroke="#5d4037"/>'
body += '<path d="M20,110 Q100,96 180,108 T340,104 L340,50 L20,50 Z" fill="#c5e1a5" stroke="#33691e"/>'
body += '<line x1="120" y1="230" x2="170" y2="104" stroke="#c62828" stroke-width="3"/>'
body += '<polygon points="250,230 270,230 262,50 246,50" fill="#ef9a9a" stroke="#b71c1c"/>'
body += LBL(40, 205, "甲") + LBL(40, 145, "乙") + LBL(40, 82, "丙") + LBL(176, 200, "F") + LBL(276, 160, "丁")
body += '<text x="20" y="250" font-size="12">F：斷層（未切過丙）　丁：岩脈（切過甲、乙、丙）　丙與乙之間為侵蝕面</text>'
fig_sec = svg("tm_82_q3.svg", 450, 260, body)
e.append(S("右圖為某地的地質剖面示意圖（地層未倒轉）。甲、乙、丙為沉積岩層，F 為斷層，丁為火成岩脈。由老到新的順序為何？",
  ["甲 → 乙 → F → 丙 → 丁", "甲 → 乙 → 丙 → F → 丁", "丁 → 甲 → 乙 → F → 丙", "甲 → F → 乙 → 丙 → 丁"], "甲 → 乙 → F → 丙 → 丁",
  "疊置定律：甲 → 乙 → 丙。截切定律：F 切過甲、乙但未切過丙，F 發生在乙之後、丙之前；丁切過甲、乙、丙，最年輕。", "相對地質年代：疊置與截切定律", E1, 8, fig_sec))

# 哈伯圖
H0 = 7000 / 100; close(H0, 70); close(H0 * 300, 21000)
X = lambda d: 60 + d * 2.4; Y = lambda v: 230 - v / 100 * 2.4
body = axes(40, 400, 15, 240, 60, 230) + '<line x1="60" y1="230" x2="%.1f" y2="%.1f" stroke="#1565c0" stroke-width="2"/>' % (X(140), Y(H0 * 140))
body += "".join('<circle cx="%.1f" cy="%.1f" r="4" fill="#c62828"/>' % (X(d), Y(H0 * d + dv)) for d, dv in [(20, 200), (45, -300), (70, 250), (100, 0), (125, -400)])
body += '<g stroke="#999" stroke-dasharray="4 3"><line x1="%.1f" y1="230" x2="%.1f" y2="%.1f"/><line x1="60" y1="%.1f" x2="%.1f" y2="%.1f"/></g>' % (X(100), X(100), Y(7000), Y(7000), X(100), Y(7000))
body += '<text x="%.1f" y="248">100</text><text x="14" y="%.1f">7000</text><text x="250" y="266" font-size="12">距離（百萬秒差距 Mpc）</text><text x="86" y="26" font-size="12">退行速度（km/s）</text>' % (X(100) - 10, Y(7000) + 5)
fig_hub = svg("tm_82_q4.svg", 420, 275, body)
e.append(S("右圖為星系退行速度與距離的關係圖，直線通過原點與 (100 Mpc, 7000 km/s)。依此關係，距離 300 Mpc 的星系，退行速度約為多少 km/s？",
  ["2100", "7000", "21000", "70000"], "21000",
  "哈伯定律 v = H₀d，由圖 H₀ = 7000 ÷ 100 = 70 km/s/Mpc。d = 300 Mpc ⇒ v = 70 × 300 = 21000 km/s。", "哈伯定律的計算", E3, 32, fig_hub))
e.append(M("承上圖，下列敘述哪些正確？（應選 2 項）",
  ["距離越遠的星系，退行速度越快", "直線的斜率即為哈伯常數", "圖中的星系都在向銀河系靠近", "哈伯常數越大，推算的宇宙年齡越長", "此圖顯示銀河系位於宇宙的中心"], "AB",
  "(A)(B) v = H₀d，斜率為 H₀。(C) 退行速度為正，表示遠離（紅移）。(D) 宇宙年齡約為 1/H₀，H₀ 越大年齡越短。(E) 宇宙均勻膨脹，從任何星系觀測都會得到相同的關係，不代表銀河系是中心。", "哈伯定律與宇宙膨脹", E3, 32, fig_hub))

# 光譜紅移
lines = [(80, "#1565c0"), (150, "#2e7d32"), (250, "#c62828")]
body = '<rect x="40" y="30" width="300" height="50" fill="#222"/><rect x="40" y="130" width="300" height="50" fill="#222"/>'
body += "".join('<rect x="%d" y="30" width="4" height="50" fill="%s"/>' % (x, c) for x, c in lines)
body += "".join('<rect x="%d" y="130" width="4" height="50" fill="%s"/>' % (x + 30, c) for x, c in lines)
body += '<text x="40" y="22" font-size="12">實驗室中的吸收譜線</text><text x="40" y="122" font-size="12">星系 A 的吸收譜線</text>'
body += '<text x="40" y="200" font-size="12">← 波長短（藍）</text><text x="250" y="200" font-size="12">波長長（紅）→</text>'
fig_red = svg("tm_82_q6.svg", 380, 210, body)
e.append(S("右圖比較實驗室中某元素的吸收譜線與星系 A 光譜中同一組譜線的位置。由圖可推知星系 A：",
  ["正在遠離我們", "正在靠近我們", "表面溫度比太陽低", "與我們的距離固定不變"], "正在遠離我們",
  "星系 A 的譜線整體往波長較長的一側移動，為紅移；由都卜勒效應，光源遠離觀測者時波長變長。紅移與表面溫度（輻射曲線的峰值）無關。", "紅移與都卜勒效應", E3, 30, fig_red, "易"))

PKGS = [
  dict(id="tm_80", parent="tm_7", subject="數學", items=m,
       chapter="第1章：三角函數（1-1 弧度量、1-2 三角函數的圖形、1-3 三角的和角與差角公式、1-4 正餘弦函數的疊合）", unit="補充題庫（段考題型：選填題、由圖形求參數、附圖的幾何應用）",
       title="數學 第1章 段考題型補充題庫（選填與附圖）",
       why="第一次段考數學 A 有 10 格選填（每格 6 分，全對才給分），而且多題附圖（由圖形求 a、b、k，半圓上的點求最大值，扇形）。本題庫補上可輸入數值自動批改的選填題，其中 7 題附圖。",
       keywords=["選填題", "由圖形求正弦函數", "扇形面積", "二倍角", "差角公式", "疊合", "摩天輪", "週期"],
       concepts=["由圖形求 y = a sin(bx) + k：a = (最大 − 最小)/2，k = (最大 + 最小)/2，相鄰最高點與最低點相距半週期", "弧長 s = rθ，扇形面積 = ½r²θ = ½rs", "tan(α − β) = (tanα − tanβ)/(1 + tanα tanβ)", "sin2θ = 2sinθcosθ，cos2θ = cos²θ − sin²θ", "a sin x + b cos x 的最大值 √(a² + b²)"],
       pitfalls=["選填題全部格子都要對才給分，分數要約成最簡", "讀圖時先找最高點、最低點與相鄰的距離，再求週期", "角度要用弧度（弳）計算弧長與扇形面積"]),
  dict(id="tm_81", parent="tm_56", subject="生物", items=b,
       chapter="第2章：植物體的形態、構造與功能（2-1 植物體的組成與體制、2-2 植物體的根莖葉）", unit="補充題庫（段考題型：附圖判讀——根尖分區、維管束、莖與葉的橫切面、心材與邊材、卡氏帶）",
       title="生物 第2章 段考題型補充題庫（附圖判讀）",
       why="第一次段考生物有 7 題附圖（維管束切片判讀、根尖分區、葉的構造、心材與邊材、共質體與質外體），tm_56 沒有附圖題。本題庫以示意圖重繪這些題型，並附多選題（每答錯 1 個選項倒扣 1/5）。",
       keywords=["根尖", "生長點", "根毛", "維管束", "韌皮部", "木質部", "形成層", "單子葉與雙子葉", "柵狀組織", "海綿組織", "氣孔", "心材", "邊材", "卡氏帶", "內皮"],
       concepts=["根尖由下往上：根冠、生長點、延長區、成熟區（根毛區）", "雙子葉莖的維管束環狀排列，由外而內為韌皮部、形成層、木質部；單子葉莖的維管束散生、無形成層", "葉片：上表皮、柵狀組織、海綿組織、下表皮（氣孔多在下表皮）", "心材不再運輸水分，邊材仍可運輸", "內皮的卡氏帶阻斷質外體途徑"],
       pitfalls=["韌皮部在外、木質部在內，不要記反", "根毛是單一表皮細胞的突起，不是多細胞構造", "多選題答錯會倒扣，沒有把握的選項要判斷清楚"]),
  dict(id="tm_82", parent="tm_17", subject="地球科學", items=e,
       chapter="地球的歷史（主題2 相對地質年代與絕對地質年代）＋天文（主題6 宇宙結構與宇宙膨脹）", unit="補充題庫（段考題型：附圖判讀——化石分布表、地質剖面、哈伯圖、紅移光譜）",
       title="地球科學 段考題型補充題庫（附圖判讀）",
       why="第一次段考地球科學 40 題中有 7 題附圖（化石消長表、化石共存區間、紅移與哈伯定律、行星晝夜溫差、天體距離尺度），本題庫以示意圖重繪化石、地質剖面、哈伯圖與光譜題型。",
       keywords=["化石對比", "標準化石", "疊置定律", "截切定律", "哈伯定律", "紅移", "宇宙膨脹"],
       concepts=["化石共存區間：同時含有兩種化石的地層，年代落在兩者生存時間的重疊範圍", "標準化石：生存時間短、分布廣、數量多、特徵明顯", "疊置定律：未倒轉時下老上新；截切定律：切過者較新", "哈伯定律 v = H₀d，宇宙年齡約 1/H₀", "譜線往長波長移動為紅移，表示遠離"],
       pitfalls=["截切定律：斷層沒有切過的地層比斷層新", "紅移是譜線位置移動，與恆星顏色、溫度不同", "宇宙膨脹沒有中心"]),
]

for p in PKGS:
    d = os.path.join(MAT, p["id"]); os.makedirs(os.path.join(d, "figures"), exist_ok=True)
    qs = []
    for i, it in enumerate(p["items"], 1):
        q = dict(questionId="%s_q%d" % (p["id"], i), materialId=p["id"], questionNumber=str(i), type=it["type"],
                 questionSource="AI_GENERATED", origin="AI", question=it["question"], options=it["options"], answer=it["answer"],
                 explanation=it["explanation"], page=it["page"], section=it["section"], version="1", createdDate=DATE,
                 knowledgePoint=it["knowledgePoint"], difficulty=it["difficulty"],
                 reference="AI 自編（非課本原題、非段考原題），依長榮 115-1 第一次段考的題型與 %s 的範圍命題；數值答案與附圖經 source/build-figure-supplements.py 驗算、繪製" % p["parent"])
        if it["fig"]:
            q["figureSvg"] = '<img class="q-figure-img" src="docs/TeachingMaterials/materials/%s/figures/%s" alt="附圖（示意圖，AI 繪製）" loading="lazy">' % (p["id"], it["fig"])
        qs.append(q)
    used = sorted({it["fig"] for it in p["items"] if it["fig"]})
    for name in used:
        open(os.path.join(d, "figures", name), "w", encoding="utf-8").write(FIGS[name])
    multi = sum(1 for q in qs if q["question"].startswith("【多選題】"))
    fill = sum(1 for q in qs if q["type"] == "calculation")
    figq = sum(1 for q in qs if "figureSvg" in q)
    w = lambda name, obj: open(os.path.join(d, name), "w", encoding="utf-8").write(json.dumps(obj, ensure_ascii=False, indent=2) + "\n")
    w("questionbank.json", dict(materialId=p["id"], questions=qs))
    w("metadata.json", dict(materialId=p["id"], school="cjsh", semester="g2s1", subject=p["subject"], grade="高二", publisher=None,
                             chapter=p["chapter"], unit=p["unit"], keywords=p["keywords"], difficulty=None, source="補充題庫",
                             uploadDate=DATE, version="1", materialType="REFERENCE"))
    w("manifest.json", dict(materialId=p["id"], packageVersion="1", createdDate=DATE, updatedDate=DATE, repositoryVersion="EO-S1.1-003",
                             analysisEngine="Claude", status="complete"))
    w("related.json", dict(materialId=p["id"], related=[dict(materialId=p["parent"], reason="補充題庫：為 %s 補充的段考題型練習題（依長榮 115-1 第一次段考出題型態，含附圖），題目為 AI 依該教材範圍命題" % p["parent"])]))
    w("summary.json", dict(materialId=p["id"], coreConcepts=p["concepts"], definitions=[], keywords=p["keywords"], keyPoints=p["concepts"][:3],
                            pitfalls=p["pitfalls"], reviewSuggestions=["先在「月考資料」看段考原題與解析，再用這份補充題庫練習同型題", "附圖題先看清楚圖中標示，再判斷每個選項"]))
    kinds = "單選 %d、多選 %d、選填 %d" % (len(qs) - multi - fill, multi, fill)
    open(os.path.join(d, "material.md"), "w", encoding="utf-8").write(
        "# %s — 長榮中學高二 %s\n\n- **科目**：%s（高二上）\n- **母教材**：%s\n- **題數**：%d 題（%s），其中 %d 題附圖；`questionSource` 全部為 `AI_GENERATED`\n- **用途**：%s\n\n"
        "## 產出與驗算（誠實揭露）\n\n1. 題目全部由 Claude 依母教材範圍與段考題型原創，不是課本原題，也不是段考原題（段考原題在「月考資料」頁）。\n"
        "2. 附圖是 `source/build-figure-supplements.py` 依題目數據繪製的示意圖（`figures/*.svg`），不是考卷或課本的照片；函數圖形依題目的函數逐點描繪。\n"
        "3. 數值答案先手算，再由同一支程式逐題驗算；選項互不重複、答案必在選項中。\n"
        "4. 選填題在平時練習與模擬月考中輸入答案自動批改；多選題選項自帶 (A)～(E) 代號，不會被打亂順序。\n" % (
            p["id"], p["title"], p["subject"], p["parent"], len(qs), kinds, figq, p["why"]))
    src = os.path.join(d, "source"); os.makedirs(src, exist_ok=True)
    open(os.path.join(src, "build-figure-supplements.py"), "w", encoding="utf-8").write(open(__file__, encoding="utf-8").read())
    print(p["id"], p["parent"], len(qs), "questions:", kinds, "figures", figq)
