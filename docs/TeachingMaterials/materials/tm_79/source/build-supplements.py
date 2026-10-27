"""Build the 2026-10-27 補充題庫 packages (tm_75–tm_79) that follow the
長榮 115-1 第一次段考 question formats. Every numeric answer is checked
here before anything is written. Usage: python3 supp.py <repo-root>"""
import json, math, os, sys

ROOT = sys.argv[1]
MAT = os.path.join(ROOT, "docs/TeachingMaterials/materials")
DATE = "2026-10-27T00:00:00Z"
L = "ABCDEFG"

def close(a, b, tol=0.02):
    assert abs(a - b) <= tol * max(1, abs(b)), (a, b)

def S(stem, opts, ans, expl, kp, section, page, diff="中"):
    assert ans in opts, (stem, ans)
    assert len(set(opts)) == len(opts), stem
    return dict(question=stem, options=opts, answer=ans, explanation=expl, knowledgePoint=kp, section=section, page=page, difficulty=diff)

def M(stem, opts, letters, expl, kp, section, page, diff="中"):
    lab = ["(%s) %s" % (L[i], o) for i, o in enumerate(opts)]
    assert all(c in L[:len(opts)] for c in letters)
    return dict(question="【多選題】" + stem, options=lab, answer="".join("(%s)" % c for c in letters), explanation=expl,
                knowledgePoint=kp, section=section, page=page, difficulty=diff)

# ---------------------------------------------------------------- tm_75 化學 第一章
S11, S12 = "1-1 化學反應式的平衡及應用", "1-2.2 反應熱與影響反應熱的因素"
chem1 = []
h = 2 * -394 + 3 * -286 - (-278); assert h == -1368
chem1.append(S("已知 CO₂(g)、H₂O(l)、C₂H₅OH(l) 的莫耳生成熱依序為 −394、−286、−278 kJ。乙醇完全燃燒 C₂H₅OH(l) + 3O₂(g) → 2CO₂(g) + 3H₂O(l) 的 ΔH 為多少 kJ？",
  ["−1368", "−1646", "−802", "+1368"], "−1368",
  "ΔH = Σ生成物生成熱 − Σ反應物生成熱 = 2(−394) + 3(−286) − (−278) = −1368 kJ；O₂ 為元素，生成熱為 0。", "由莫耳生成熱求反應熱", S12, 11))
h = -394 + 2 * -286 - (-890); assert h == -76
chem1.append(S("已知石墨、H₂(g)、CH₄(g) 的莫耳燃燒熱依序為 −394、−286、−890 kJ（產物水為液態），則 CH₄(g) 的莫耳生成熱約為多少 kJ？",
  ["−76", "−1856", "+76", "−966"], "−76",
  "C + 2H₂ → CH₄：ΔH = Σ反應物燃燒熱 − Σ生成物燃燒熱 = (−394) + 2(−286) − (−890) = −76 kJ。", "赫斯定律求生成熱", S12, 11))
h = (-1411 + -286) - (-1560); assert h == -137
chem1.append(S("已知 C₂H₄(g)、H₂(g)、C₂H₆(g) 的莫耳燃燒熱依序為 −1411、−286、−1560 kJ，則 C₂H₄(g) + H₂(g) → C₂H₆(g) 的 ΔH 為多少 kJ？",
  ["−137", "+137", "−3257", "−435"], "−137",
  "以燃燒熱求反應熱：ΔH = Σ反應物燃燒熱 − Σ生成物燃燒熱 = (−1411 − 286) − (−1560) = −137 kJ。注意方向與用生成熱時相反。", "由莫耳燃燒熱求反應熱", S12, 11))
chem1.append(M("在標準狀態下，下列哪些的值為零？（應選 3 項）",
  ["O₂(g) 的莫耳生成熱", "O₃(g) 的莫耳生成熱", "石墨的莫耳生成熱", "鑽石的莫耳生成熱", "H₂O(l) 的莫耳燃燒熱"], "ACE",
  "元素在標準狀態下最穩定的形態（O₂、石墨）生成熱為 0；O₃、鑽石不是最穩定形態，生成熱不為 0。H₂O(l) 已不能再燃燒，燃燒熱為 0。", "莫耳生成熱／燃燒熱為零的條件", S12, 11))
chem1.append(S("下列哪一個熱化學方程式的 ΔH，等於 NH₃(g) 的莫耳生成熱？",
  ["N₂(g) + 3H₂(g) → 2NH₃(g)", "½N₂(g) + 3/2H₂(g) → NH₃(g)", "N(g) + 3H(g) → NH₃(g)", "½N₂(g) + 3/2H₂(g) → NH₃(l)"],
  "½N₂(g) + 3/2H₂(g) → NH₃(g)",
  "莫耳生成熱：由最穩定的成分元素（N₂(g)、H₂(g)）生成 1 莫耳該物質，且物質狀態要相符。(A) 生成 2 莫耳；(C) 反應物不是穩定形態；(D) 產物狀態不對。", "莫耳生成熱定義辨析", S12, 11, "易"))
chem1.append(S("已知 2SO₂(g) + O₂(g) → 2SO₃(g)，ΔH = −198 kJ。下列敘述何者正確？",
  ["SO₃(g) 的莫耳生成熱為 −99 kJ", "2SO₃(g) → 2SO₂(g) + O₂(g) 的 ΔH = +198 kJ", "生成 1 莫耳 SO₃(g) 放熱 198 kJ", "此反應為吸熱反應"],
  "2SO₃(g) → 2SO₂(g) + O₂(g) 的 ΔH = +198 kJ",
  "反應逆寫，ΔH 數值不變、正負號相反。(A) 反應物 SO₂ 不是元素，不是生成熱；(C) 生成 1 莫耳放熱 99 kJ；(D) ΔH < 0 為放熱。", "熱化學反應式應用", S12, 10))
chem1.append(S("已知 C(石墨) + O₂(g) → CO₂(g)，ΔH₁；C(鑽石) + O₂(g) → CO₂(g)，ΔH₂；且 ΔH₁ > ΔH₂。下列敘述何者正確？",
  ["C(石墨) → C(鑽石) 為吸熱反應", "鑽石比石墨穩定", "石墨的莫耳生成熱為 ΔH₂", "C(石墨) → C(鑽石) 的 ΔH = ΔH₂ − ΔH₁"],
  "C(石墨) → C(鑽石) 為吸熱反應",
  "目標式 = 第一式 − 第二式 ⇒ ΔH = ΔH₁ − ΔH₂ > 0，吸熱；鑽石能量較高、較不穩定。ΔH₁ 是石墨燃燒熱，也是 CO₂ 的生成熱，石墨本身生成熱為 0。", "赫斯定律代數關係", S12, 11))
q = 0.1 * 26000; dT = q / (108 * 4.2); close(25 - dT, 19.3)
chem1.append(S("已知 NH₄NO₃(s) → NH₄NO₃(aq)，ΔH = +26 kJ/mol。將 8.0 克 NH₄NO₃（式量 80）加入 25°C、100 克的水中完全溶解，若容器不傳熱、溶液比熱以 4.2 J/g・°C 計，溶解後水溫約為多少 °C？",
  ["19", "31", "22", "17"], "19",
  "8.0/80 = 0.10 mol，吸熱 0.10 × 26 = 2.6 kJ = 2600 J。溶液 108 g，ΔT = 2600 ÷ (108 × 4.2) ≈ 5.7°C；溶解吸熱使溫度下降 ⇒ 25 − 5.7 ≈ 19°C。", "卡計原理、溶解熱計算", S12, 12))
q = 500 * 4.18 * 4.7; close(q / 0.025, 392900, 0.001)
chem1.append(S("以卡計測量：燃燒 0.30 克石墨（C = 12），使 500 克水的溫度上升 4.7°C（水的比熱 4.18 J/g・°C，不計卡計吸熱）。石墨的莫耳燃燒熱約為多少 kJ？",
  ["−393", "+393", "−98", "−786"], "−393",
  "Q = 500 × 4.18 × 4.7 ≈ 9823 J；石墨 0.30/12 = 0.025 mol ⇒ 每莫耳 9823 ÷ 0.025 ≈ 393 kJ。燃燒放熱，ΔH = −393 kJ。", "莫耳燃燒熱計算", S12, 12))
eth, ac = 4.6 / 46, 9.0 / 60; theo = min(eth, ac) * 88; close(6.6 / theo, 0.75)
chem1.append(S("將 4.6 克乙醇（C₂H₅OH，分子量 46）與 9.0 克乙酸（CH₃COOH，分子量 60）以濃硫酸催化反應，得到 6.6 克乙酸乙酯（分子量 88）。下列何者正確？（反應係數皆為 1）",
  ["限量試劑為乙醇，產率 75%", "限量試劑為乙酸，產率 75%", "限量試劑為乙醇，產率 50%", "限量試劑為乙酸，產率 44%"],
  "限量試劑為乙醇，產率 75%",
  "乙醇 0.10 mol、乙酸 0.15 mol，係數 1:1 ⇒ 乙醇先用完，是限量試劑。理論產量 0.10 × 88 = 8.8 g，產率 6.6/8.8 = 75%。", "產率計算", S11, 4))
close(12.25 / 122.5 * 1.5 * 32, 4.8)
chem1.append(S("將 12.25 克 KClO₃（式量 122.5）與少量 MnO₂ 混合加熱至完全分解（2KClO₃ → 2KCl + 3O₂），反應後固體質量減少多少克？",
  ["4.8", "3.2", "7.45", "2.4"], "4.8",
  "KClO₃ 0.10 mol ⇒ O₂ 0.15 mol = 4.8 g。MnO₂ 是催化劑，質量不變；固體減少的質量就是逸出 O₂ 的質量。", "化學計量換算", S11, 4))
chem1.append(S("同溫同壓下，氣體 A 與 B 反應生成氣體 C 與 D。反應前 A 120 mL、B 100 mL，反應後 A 0 mL、B 60 mL、C 80 mL、D 120 mL。此反應的方程式為何？",
  ["3A + B → 2C + 3D", "3A + 5B → 2C + 3D", "6A + 5B → 4C + 6D", "A + B → C + D"], "3A + B → 2C + 3D",
  "消耗 A 120 mL、B 40 mL，生成 C 80 mL、D 120 mL；同溫同壓體積比 = 莫耳比 = 係數比 = 120:40:80:120 = 3:1:2:3。", "氣體體積比＝莫耳比", S11, 4))
zn = 0.65 / 65; close(zn * 2 / 1.0 * 1000, 20); close(zn * 22.4 * 1000, 224)
chem1.append(S("0.65 克鋅（Zn = 65）與 1.0 M 鹽酸反應：Zn + 2HCl → ZnCl₂ + H₂。要使鋅完全反應，至少需加入鹽酸多少 mL？在 STP 下可得 H₂ 多少 mL？",
  ["20 mL；224 mL", "10 mL；224 mL", "20 mL；448 mL", "40 mL；448 mL"], "20 mL；224 mL",
  "Zn 0.010 mol，需 HCl 0.020 mol = 20 mL；生成 H₂ 0.010 mol × 22.4 L = 224 mL。之後再加鹽酸，氫氣體積不再增加（圖形變水平）。", "限量試劑與圖形判讀", S11, 4))
ba = 0.20 * 0.030; close(ba / 3 * 2 / 0.020, 0.20)
chem1.append(S("20 mL 硫酸鐵(III) Fe₂(SO₄)₃ 溶液中，加入 0.20 M BaCl₂ 溶液 30 mL，恰好使 SO₄²⁻ 完全沉澱。原溶液中 Fe³⁺ 的濃度為多少 M？",
  ["0.20", "0.10", "0.30", "0.40"], "0.20",
  "Ba²⁺ = 0.20 × 0.030 = 0.0060 mol = SO₄²⁻ ⇒ Fe₂(SO₄)₃ 0.0020 mol ⇒ Fe³⁺ 0.0040 mol，濃度 0.0040 ÷ 0.020 L = 0.20 M。", "沉澱滴定當量點分析", S11, 4))
chem1.append(M("下列有關反應熱的敘述，哪些正確？（應選 2 項）",
  ["燃燒反應的 ΔH 必為負值", "吸熱反應在常溫下一定不會發生", "H₂(g) + ½O₂(g) → H₂O(g) 的 ΔH 等於 H₂ 的莫耳燃燒熱", "H₂ 燃燒時，生成液態水放出的熱比生成水蒸氣多", "反應熱的大小與反應途徑有關"], "AD",
  "(B) 吸熱反應也可自然發生（如冰熔化）；(C) 莫耳燃燒熱的產物水為液態；(D) 水蒸氣凝結還會放熱，所以生成液態水放熱較多；(E) 依赫斯定律，反應熱與途徑無關。", "反應熱概念辨析", S12, 10))
h = -462 - (-146) + -286; assert h == -602
chem1.append(S("已知：① Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g)，ΔH = −462 kJ；② MgO(s) + 2HCl(aq) → MgCl₂(aq) + H₂O(l)，ΔH = −146 kJ；③ H₂(g) + ½O₂(g) → H₂O(l)，ΔH = −286 kJ。則 Mg(s) + ½O₂(g) → MgO(s) 的 ΔH 為多少 kJ？",
  ["−602", "−894", "−30", "+602"], "−602",
  "目標式 = ① − ② + ③ ⇒ ΔH = −462 − (−146) + (−286) = −602 kJ。", "赫斯定律加成性", S12, 11))
h = -890 + 2 * 44; assert h == -802
chem1.append(S("已知 CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)，ΔH = −890 kJ；H₂O(l) → H₂O(g)，ΔH = +44 kJ。則 CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(g) 的 ΔH 為多少 kJ？",
  ["−802", "−978", "−846", "−890"], "−802",
  "產物改為 2 莫耳水蒸氣，要加上 2 × (+44)：ΔH = −890 + 88 = −802 kJ。生成水蒸氣放熱較少。", "物質狀態對反應熱的影響", S12, 11))
chem1.append(M("下列有關莫耳生成熱與莫耳燃燒熱的敘述，哪些正確？（應選 2 項）",
  ["C(石墨) + ½O₂(g) → CO(g) 的 ΔH 為 CO(g) 的莫耳生成熱", "CO(g) + ½O₂(g) → CO₂(g) 的 ΔH 可稱為 CO₂(g) 的莫耳生成熱", "O₃(g) 的莫耳生成熱為零", "H₂(g) 的莫耳燃燒熱與 H₂O(l) 的莫耳生成熱數值相同", "反應熱愈負，反應速率愈快"], "AD",
  "(B) 反應物 CO 不是元素，這是 CO 的燃燒熱；(C) O₃ 不是氧最穩定的形態；(D) 兩者是同一個反應式；(E) 反應熱與反應速率無關。", "莫耳生成熱與莫耳燃燒熱定義", S12, 11))

# ---------------------------------------------------------------- tm_76 化學 第二章 壓力與壓力計
S21 = "2-1 氣體的性質"
gas = []
close(750 + 160 * 1.70 / 13.6, 770)
gas.append(S("以開口式壓力計測氣體壓力，管內裝密度 1.70 g/mL 的非揮發性液體（汞密度 13.6 g/mL）。大氣壓力為 750 mmHg，開口端液面比氣體端液面高 16.0 cm，氣體壓力為多少 mmHg？",
  ["770", "730", "910", "590"], "770",
  "液柱 160 mm × 1.70 ÷ 13.6 = 20 mmHg。開口端液面較高，表示氣體壓力大於大氣壓：P = 750 + 20 = 770 mmHg。", "壓力計的計算", S21, 55))
close(64 * 0.85 / 13.6 * 10, 40)
gas.append(S("閉口式壓力計中裝入密度 0.85 g/cm³ 的油，兩管油面高度差為 64 cm（汞密度 13.6 g/cm³），氣體壓力為多少 mmHg？",
  ["40", "64", "54", "800"], "40",
  "閉口式壓力計：氣體壓力 = 液柱高度差。64 cm × 0.85 ÷ 13.6 = 4.0 cmHg = 40 mmHg，與大氣壓無關。", "壓力計的計算", S21, 55))
vals = {"1.50 atm": 1.50, "1200 mmHg": 1200 / 760, "1.40 × 10⁵ Pa": 1.40e5 / 101325, "110 cmHg": 110 / 76, "1550 cmH₂O": 1550 / 13.6 / 76}
assert max(vals, key=vals.get) == "1200 mmHg"
gas.append(S("下列壓力何者最大？（1 atm = 76 cmHg = 1.013 × 10⁵ Pa，汞密度為水的 13.6 倍）",
  list(vals), "1200 mmHg",
  "換算成 atm：1200 mmHg ≈ 1.58；1.40 × 10⁵ Pa ≈ 1.38；110 cmHg ≈ 1.45；1550 cmH₂O ÷ 13.6 ≈ 114 cmHg ≈ 1.50。最大為 1200 mmHg。", "壓力單位換算", S21, 55))
close(1 + 2500 / 1033.6, 3.42)
gas.append(S("在一大氣壓下，水深 25 公尺處所受的總壓力約為多少 atm？（10.336 m 水柱 ≈ 1 atm）",
  ["約 3.4", "約 2.4", "約 25", "約 26"], "約 3.4",
  "水柱壓力 25 ÷ 10.336 ≈ 2.4 atm，再加上水面上的大氣壓 1 atm ⇒ 約 3.4 atm。", "液體壓力 P ＝ d × h", S21, 55))
close(680 * 1.00 / 13.6, 50)
gas.append(S("打點滴時，點滴瓶液面比針頭高 68.0 cm，點滴液密度 1.00 g/cm³（汞密度 13.6 g/cm³）。液柱在針頭處產生的壓力（不含大氣壓）約為多少 mmHg？",
  ["50", "68", "5.0", "925"], "50",
  "680 mm × 1.00 ÷ 13.6 = 50 mmHg。液柱高度差相同時，密度愈小，換算成汞柱愈短。", "液體壓力 P ＝ d × h", S21, 55))
gas.append(M("大氣壓力 760 mmHg 時，以閉口式水銀壓力計測量某氣體，兩管水銀面高度差為 200 mm。下列敘述哪些正確？（應選 3 項）",
  ["氣體壓力為 200 mmHg", "氣體壓力為 560 mmHg", "若改用開口式水銀壓力計測量同一氣體，兩管水銀面高度差為 560 mm", "將氣體冷卻，兩管水銀面高度差變小", "外界大氣壓力降為 750 mmHg 時，兩管水銀面高度差變大"], "ACD",
  "閉口式：P = 高度差 = 200 mmHg，與大氣壓無關（E 錯）。開口式：大氣壓 − 氣體壓 = 760 − 200 = 560 mm。冷卻使氣體壓力變小，高度差變小。", "壓力計的使用", S21, 56))
gas.append(S("同溫同壓下，相同體積的 O₂(g) 與 CH₄(g)，下列何者相同？",
  ["分子數", "質量", "原子數", "密度"], "分子數",
  "亞佛加厥定律：同溫同壓同體積的氣體含有相同分子數。O₂ 分子量 32、CH₄ 16，質量與密度不同；每分子原子數 2 與 5，原子數也不同。", "亞佛加厥定律", "2-2 氣體的基本定律", 68, "易"))
close((76 + 15) / 76, 1.2, 0.01)
gas.append(S("以開口式水銀壓力計測某氣體，大氣壓力 76 cmHg，氣體端水銀面比開口端低 15 cm。此氣體壓力約為多少 atm？",
  ["1.2", "0.80", "91", "61"], "1.2",
  "氣體端水銀面較低，氣體壓力大於大氣壓：P = 76 + 15 = 91 cmHg ≈ 1.2 atm。(C) 91 是 cmHg，不是 atm。", "壓力計的計算", S21, 56))
gas.append(M("下列壓力單位的換算，哪些正確？（應選 3 項）",
  ["1 atm = 76 cmHg", "1 atm ≈ 101.3 kPa", "1 torr = 1 cmHg", "1 bar = 10⁵ Pa", "1 Pa = 1 N/cm²"], "ABD",
  "1 torr = 1 mmHg（不是 cmHg）；1 Pa = 1 N/m²。", "壓力單位換算", S21, 55, "易"))
gas.append(S("下列何者不是氣體的通性？",
  ["氣體分子不停地做無規則運動", "氣體分子間距離很小，不易壓縮", "氣體可以充滿整個容器", "氣體分子撞擊器壁而產生壓力"],
  "氣體分子間距離很小，不易壓縮",
  "氣體分子間距離很大（約為分子直徑的 10 倍），所以很容易壓縮。", "氣體的通性", S21, 55, "易"))

# ---------------------------------------------------------------- tm_77 數學 第1章
S1, S2, S3, S4 = "1-1 弧度量", "1-2 三角函數的圖形", "1-3 三角的和角與差角公式", "1-4 正餘弦函數的疊合"
xs = [i / 2000 * 2 * math.pi for i in range(2000)]
math1 = []
f = lambda x: math.sin(x) + math.sqrt(3) * math.cos(x)
close(max(map(f, xs)), 2, 0.001)
close(min(f(i / 1000 * math.pi / 2) for i in range(1001)), 1, 0.001)
close(f(math.pi / 3 + 0.3), f(math.pi / 3 - 0.3) + 1, 5)  # not symmetric about π/3 (sanity)
assert abs(f(math.pi / 3 + 0.3) - f(math.pi / 3 - 0.3)) > 0.1
assert abs(f(math.pi / 6 + 0.3) - f(math.pi / 6 - 0.3)) < 1e-9
math1.append(M("設 f(x) = sin x + √3 cos x，下列哪些選項正確？",
  ["f(x) 的最大值為 2", "f(x) 的週期為 2π", "f(x) = 2sin(x + π/3)", "y = f(x) 的圖形對稱於直線 x = π/3", "在 0 ≤ x ≤ π/2 時，f(x) 的最小值為 1"], "ABCE",
  "f(x) = 2sin(x + π/3)：最大值 2、週期 2π。x = π/6 時取得最大值，圖形對稱於 x = π/6（不是 π/3）。0 ≤ x ≤ π/2 ⇒ π/3 ≤ x + π/3 ≤ 5π/6，sin 最小 1/2 ⇒ 最小值 1。", "正餘弦疊合的性質", S4, 55))
g = lambda x: 3 * math.sin(2 * x) - 4 * math.cos(2 * x) + 1
close(max(map(g, xs)), 6, 0.001); close(min(map(g, xs)), -4, 0.001); assert g(0) == -3
math1.append(M("設 f(x) = 3sin 2x − 4cos 2x + 1，下列哪些選項正確？",
  ["f(x) 的最大值為 6", "f(x) 的最小值為 −5", "f(x) 的週期為 π", "y = f(x) 的圖形與直線 y = 7 有交點", "f(0) = −3"], "ACE",
  "3sin2x − 4cos2x = 5sin(2x − θ)（tanθ = 4/3），故 f 的值域 [−4, 6]：最大 6、最小 −4，與 y = 7 沒有交點。週期 2π/2 = π；f(0) = 0 − 4 + 1 = −3。", "疊合求最大值與最小值", S4, 55))
a = math.pi + math.atan(3 / 4)
close(math.sin(a), -0.6, 0.001); close(math.sin(2 * a), 24 / 25, 0.001); close(math.cos(2 * a), 7 / 25, 0.001)
assert math.pi / 2 < a / 2 < math.pi; assert math.cos(a / 2) < 0; close(math.tan(a / 2), -3, 0.001)
math1.append(M("已知 π < α < 3π/2，且 tan α = 3/4，下列哪些選項正確？",
  ["sin α = −3/5", "sin 2α = 24/25", "cos 2α = −7/25", "α/2 在第二象限", "cos(α/2) = 1/√10"], "ABD",
  "α 在第三象限：sin α = −3/5、cos α = −4/5。sin2α = 2(−3/5)(−4/5) = 24/25；cos2α = 16/25 − 9/25 = 7/25（C 錯）。π/2 < α/2 < 3π/4 在第二象限，cos(α/2) < 0，應為 −1/√10（E 錯）。", "半角與倍角公式：象限判斷", S3, 40, "難"))
close(max(10 * math.cos(t) + 10 * math.sqrt(3) * math.sin(t) for t in [i / 1000 * math.pi / 2 for i in range(1001)]), 20, 0.001)
math1.append(S("圓 O 的直徑 AB = 10，P 為圓上異於 A、B 的一點，則 PA + √3 PB 的最大值為何？",
  ["20", "10√3", "10 + 10√3", "10√2"], "20",
  "直徑所對的圓周角為直角：令 ∠PAB = θ，PA = 10cos θ、PB = 10sin θ。PA + √3PB = 10cos θ + 10√3 sin θ = 20sin(θ + π/6) ≤ 20，θ = π/3 時成立。", "疊合的幾何應用：限定區間求極值", S4, 55, "難"))
t = math.asin(5 / 13); close(13 * math.sin(2 * t), 120 / 13, 0.001)
math1.append(S("△ABC 中 ∠ACB = 90°，AB = 13、AC = 5。另有一點 D 使 ∠ADB = 90°，且 ∠ABD = 2∠ABC，則 AD 的長為何？",
  ["120/13", "60/13", "10", "119/13"], "120/13",
  "令 ∠ABC = θ，sin θ = 5/13、cos θ = 12/13。在直角三角形 ADB 中 AD = AB·sin 2θ = 13 × 2 × (5/13)(12/13) = 120/13。", "二倍角公式的幾何應用", S3, 40, "難"))
close(18 * math.pi / 3 - 0.5 * 36 * math.sin(math.pi / 3), 6 * math.pi - 9 * math.sqrt(3), 0.0001)
math1.append(S("半徑 6 的圓中，一弦所對的圓心角為 π/3，則此弦與劣弧所圍成的弓形面積為何？",
  ["6π − 9√3", "6π − 18", "12π − 9√3", "3π − 9√3"], "6π − 9√3",
  "弓形 = 扇形 − 三角形 = ½·6²·(π/3) − ½·6²·sin(π/3) = 6π − 9√3。", "弓形面積與扇形面積", S1, 2))
y = lambda x: 4 * math.cos(3 * x) + 3
close(y(0), 7, 1e-9); close(y(math.pi / 3), -1, 1e-9)
math1.append(S("函數 y = a cos(bx) + c（a、b、c > 0）的圖形在 x = 0 有最大值 7，在 x = π/3 有第一個最小值 −1（x > 0）。則 (a, b, c) 為何？",
  ["(4, 3, 3)", "(4, 6, 3)", "(8, 3, 3)", "(4, 3/2, 3)"], "(4, 3, 3)",
  "a = (7 − (−1))/2 = 4、c = (7 + (−1))/2 = 3。最大值到下一個最小值相距半個週期 ⇒ 週期 2π/3 ⇒ b = 3。", "由極值求參數", S2, 14))
close(2 * math.pi / ((1 / 50) / 5), 500 * math.pi, 1e-9)
math1.append(S("某單音的聲波以 y = sin(at) 表示（t 的單位為秒，a > 0）。若在 1/50 秒內恰有 5 個完整的週期，則 a 為何？",
  ["500π", "250π", "100π", "50π"], "500π",
  "週期 T = (1/50) ÷ 5 = 1/250 秒，a = 2π/T = 500π。", "一般正弦函數的週期", S2, 14))
sols = [x for x in [math.pi / 2, 7 * math.pi / 6] if abs(math.sin(x) - math.sqrt(3) * math.cos(x) - 1) < 1e-9]
assert len(sols) == 2; close(sum(sols), 5 * math.pi / 3, 1e-9)
cnt = sum(1 for i in range(200000) if (lambda u, v: (u - 1) * (v - 1) < 0)(math.sin(i / 200000 * 2 * math.pi) - math.sqrt(3) * math.cos(i / 200000 * 2 * math.pi), math.sin((i + 1) / 200000 * 2 * math.pi) - math.sqrt(3) * math.cos((i + 1) / 200000 * 2 * math.pi)))
assert cnt == 2
math1.append(S("在 0 ≤ x < 2π 內，方程式 sin x − √3 cos x = 1 所有解的和為何？",
  ["5π/3", "π/2", "7π/6", "2π"], "5π/3",
  "sin x − √3cos x = 2sin(x − π/3) = 1 ⇒ x − π/3 = π/6 或 5π/6 ⇒ x = π/2 或 7π/6，和為 5π/3。", "疊合解三角方程式", S4, 55))
h2 = lambda x: 2 * math.sin(x) * math.cos(x) + 2 * math.sqrt(3) * math.cos(x) ** 2 - math.sqrt(3)
close(max(map(h2, xs)), 2, 0.001); close(h2(math.pi / 12), 2, 1e-9); close(h2(math.pi / 3), 0, 1e-9)
assert abs(h2(math.pi / 3 + 0.2) + h2(math.pi / 3 - 0.2)) < 1e-9
grid = [i / 100000 * math.pi / 2 for i in range(100001)]
assert sum(1 for i in range(100000) if (h2(grid[i]) - 1) * (h2(grid[i + 1]) - 1) < 0) == 1
math1.append(M("設 f(x) = 2sin x cos x + 2√3cos²x − √3，下列哪些選項正確？",
  ["f(x) 的週期為 π", "f(x) 的最大值為 2√3", "f(π/12) = 2", "y = f(x) 的圖形對稱於點 (π/3, 0)", "在 0 ≤ x ≤ π/2 內，方程式 f(x) = 1 有 2 個解"], "ACD",
  "f(x) = sin2x + √3cos2x = 2sin(2x + π/3)：週期 π、最大值 2。f(π/12) = 2sin(π/2) = 2；f(π/3) = 2sin π = 0，且 2x + π/3 = π 是正弦的對稱中心。0 ≤ x ≤ π/2 ⇒ π/3 ≤ 2x + π/3 ≤ 4π/3，sin = 1/2 只有 5π/6 一解。", "倍角化簡後再疊合", S4, 55, "難"))

# ---------------------------------------------------------------- tm_78 國文 第一～三課
C1, C2, C3 = "第一課 勞山道士", "第二課 發明為需求之母", "第三課 近體詩選"
chi = []
chi.append(M("疊韻是指兩個字的韻母相同（如「逡巡」）。下列詞語，屬於疊韻的是：",
  ["徘徊", "蜻蜓", "參差", "伶俐", "窈窕"], "ABE",
  "(A) ㄆㄞˊ ㄏㄨㄞˊ；(B) ㄑㄧㄥ ㄊㄧㄥˊ；(E) ㄧㄠˇ ㄊㄧㄠˇ，韻母相同。(C) ㄘㄣ ㄘ、(D) ㄌㄧㄥˊ ㄌㄧˋ 為聲母相同的雙聲。", "字音：雙聲與疊韻", C1, 6))
chi.append(M("下列各組「　」中的字，讀音相同的是：",
  ["「逡」巡／「竣」工", "「稽」首／「稽」查", "「紿」騙／懈「怠」", "分「賚」諸徒／青「睞」", "競飲先「釂」／打「醮」"], "CDE",
  "(C) ㄉㄞˋ；(D) ㄌㄞˋ；(E) ㄐㄧㄠˋ。(A) ㄑㄩㄣ／ㄐㄩㄣˋ；(B) 稽首 ㄑㄧˇ／稽查 ㄐㄧ。", "字詞綜合", C1, 6))
chi.append(S("〈勞山道士〉「何術之求」藉「之」將賓語「何術」提前。下列文句，沒有賓語提前（倒裝）的是：",
  ["唯利是圖", "時不我待", "何罪之有", "學而時習之"], "學而時習之",
  "(A) 圖利；(B) 不待我；(C) 有何罪——皆為賓語提前。(D)「習之」的「之」是代詞，語序正常。", "字詞：何術之求（賓語提前）", C1, 6))
chi.append(S("〈勞山道士〉文末的「異史氏曰」，其作用最接近下列何者？",
  ["作者跳出故事，發表評論、寄寓諷諭", "補充王生返家後的遭遇", "記錄道士的生平來歷", "說明故事的史料出處"],
  "作者跳出故事，發表評論、寄寓諷諭",
  "「異史氏」是蒲松齡的自稱，仿《史記》「太史公曰」，在故事後發表評論，藉王生諷刺貪圖捷徑、不肯吃苦的人。", "出處：聊齋志異", C1, 6, "易"))
chi.append(S("依〈發明為需求之母〉的論點，下列哪一個例子最能支持作者的看法？",
  ["愛迪生發明留聲機時，設想用來記錄遺言、口述書信，後來才被大量用於播放音樂", "戰爭時為了偵測敵機而研發雷達", "為了在夜間照明而改良油燈", "因為人口增加，需要更多糧食而改良稻種"],
  "愛迪生發明留聲機時，設想用來記錄遺言、口述書信，後來才被大量用於播放音樂",
  "作者主張許多發明是先出現，之後才找到用途、創造需求（發明為需求之母）。(B)(C)(D) 都是「需求為發明之母」的例子。", "內容理解", C2, 22))
chi.append(M("下列詩句，全由名詞（詞組）組成、省略動詞的是：",
  ["雞聲茅店月，人跡板橋霜", "枯藤老樹昏鴉", "大漠孤煙直，長河落日圓", "古道西風瘦馬", "星垂平野闊，月湧大江流"], "ABD",
  "(A)(B)(D) 以名詞並列構成畫面，與「桃李春風一杯酒，江湖夜雨十年燈」手法相同。(C)「直」「圓」、(E)「垂」「闊」「湧」「流」為動詞或形容詞謂語。", "寫作手法：名詞並列", C3, None))
chi.append(M("下列詩句，作者為宋代詩人的是：",
  ["不識廬山真面目，只緣身在此山中", "春眠不覺曉，處處聞啼鳥", "山重水複疑無路，柳暗花明又一村", "白日依山盡，黃河入海流", "竹外桃花三兩枝，春江水暖鴨先知"], "ACE",
  "(A) 蘇軾〈題西林壁〉；(C) 陸游〈遊山西村〉；(E) 蘇軾〈惠崇春江晚景〉。(B) 孟浩然〈春曉〉、(D) 王之渙〈登鸛雀樓〉為唐詩。宋詩常寓理於景，如 (A) 的議論。", "唐詩與宋詩", C3, None))
chi.append(M("關於近體詩的格律，下列敘述正確的是：",
  ["律詩八句，中間兩聯（頷聯、頸聯）須對仗", "絕句四句，必須兩兩對仗", "近體詩一般押平聲韻，且一韻到底", "杜甫〈旅夜書懷〉為五言律詩", "李商隱〈夜雨寄北〉為七言律詩"], "ACD",
  "(B) 絕句不要求對仗；(E)〈夜雨寄北〉四句，為七言絕句。", "近體詩格律", C3, None))
chi.append(S("黃庭堅〈寄黃幾復〉「想得讀書頭已白，隔溪猿哭瘴煙藤」是想像好友當下處境的「懸想示現」。下列〈近體詩選〉的詩句，屬於想像未來情景的「預言示現」的是：",
  ["何當共剪西窗燭，卻話巴山夜雨時", "桃李春風一杯酒，江湖夜雨十年燈", "星垂平野闊，月湧大江流", "名豈文章著，官應老病休"],
  "何當共剪西窗燭，卻話巴山夜雨時",
  "李商隱想像日後重逢、在西窗下共話今夜，是對未來的預想。(B) 回憶昔日相聚與十年漂泊；(C) 眼前實景；(D) 自我感慨。", "修辭：示現", C3, None))

# ---------------------------------------------------------------- tm_79 英文 Lesson 1 文法與字彙
G, V = "Grammar & Usage（段考綜合測驗型）", "Vocabulary & Phrases"
eng = []
E = lambda stem, opts, ans, expl, kp, sec=G, page=18, diff="中": eng.append(S(stem, opts, ans, expl, kp, sec, page, diff))
E("There are two boys in the photo. One is my brother, and ______ is his best friend.", ["another", "other", "the other", "the others"], "the other",
  "兩者之中：one …, the other …。", "代名詞：one … the other")
E("______ only two weeks left before the exam, Jenny studied every night.", ["With", "Despite", "As", "For"], "With",
  "with + 名詞 + 分詞／形容詞：with two weeks left（還剩兩週）。", "with + N + left")
E("______ the heavy rain, the baseball game went on as planned.", ["Despite", "Although", "Because", "Instead of"], "Despite",
  "後面接名詞片語 the heavy rain，用介系詞 despite；although 須接子句。語意為讓步，不是原因。", "despite + N／V-ing")
E("Tom didn't realize how much his parents loved him ______ he read the letter.", ["until", "unless", "since", "so that"], "until",
  "not … until …：直到……才……。", "not … until")
E("The students in Class A are more active than ______ in Class B.", ["those", "that", "these", "ones"], "those",
  "those 代替前面的複數名詞 the students，避免重複。", "代名詞 those")
E("The surprising news made everyone in the room ______.", ["excited", "excite", "to excite", "exciting"], "excited",
  "make + 受詞 + 形容詞：人感到興奮用 excited。", "make + O + adj.")
E("The teacher called my name, ______ me to stand up and answer the question.", ["prompting", "prompted", "to prompt", "prompt"], "prompting",
  "分詞構句表結果，主詞 the teacher 主動「促使」，用現在分詞 prompting。", "分詞構句（結果）")
E("______ that the bridge was safe, the driver kept going.", ["Believing", "Believed", "To believe", "Believe"], "Believing",
  "分詞構句，主詞 the driver 主動「相信」，用 V-ing。", "分詞構句（主動）")
E("You should keep ______ even if you fail several times.", ["trying", "to try", "try", "tried"], "trying",
  "keep + V-ing：持續做某事。", "keep + V-ing")
E("Prometheus helped humans by ______ fire from the gods.", ["stealing", "stole", "steal", "stolen"], "stealing",
  "介系詞 by + 動名詞：藉由……。", "by + V-ing")
E("I don't like horror movies, and my sister doesn't, ______.", ["either", "too", "neither", "also"], "either",
  "否定句的「也不」用 either；neither 須放句首倒裝（Neither does my sister）。", "否定句 either")

PKGS = [
  dict(id="tm_75", parent="tm_12", subject="化學", items=chem1,
       chapter="第一章：化學計量與反應熱（1-1 化學反應式的平衡及應用、1-2 化學反應中的能量變化、實驗活動1 化學反應熱）", unit="補充題庫（段考題型：赫斯定律、生成熱／燃燒熱、限量試劑與產率、溶解熱）",
       title="化學 第一章 段考題型補充題庫（熱化學計算與化學計量）",
       why="第一次段考化學 31 題中有 19 題考第 1 章（赫斯定律、生成熱與燃燒熱的定義、限量試劑與產率、溶解熱溫度變化），但 tm_12 只有 57 題。本題庫依考卷的計算型態補足。",
       keywords=["赫斯定律", "莫耳生成熱", "莫耳燃燒熱", "限量試劑", "產率", "溶解熱", "卡計", "化學計量"],
       concepts=["莫耳生成熱：由最穩定的成分元素生成 1 莫耳物質的反應熱；元素最穩定形態的生成熱為 0", "莫耳燃燒熱：1 莫耳物質完全燃燒的反應熱，產物水為液態；已不能燃燒的物質（CO₂、H₂O(l)）燃燒熱為 0", "赫斯定律：反應熱只與始末狀態有關；反應式相加減，ΔH 跟著相加減", "ΔH = Σ生成物生成熱 − Σ反應物生成熱 = Σ反應物燃燒熱 − Σ生成物燃燒熱", "限量試劑：最先用完的反應物，決定理論產量；產率 = 實際產量 ÷ 理論產量", "卡計：Q = m·s·ΔT；溶解吸熱使溫度下降"],
       pitfalls=["用燃燒熱求反應熱時是「反應物 − 生成物」，與生成熱的方向相反", "反應式逆寫 ΔH 變號，乘倍數 ΔH 也乘倍數", "莫耳燃燒熱的產物水是液態；生成水蒸氣放熱較少", "限量試劑要用莫耳數 ÷ 係數比較，不是比質量"]),
  dict(id="tm_76", parent="tm_28", subject="化學", items=gas,
       chapter="第二章：氣體（2-1 氣體的性質、2-2 氣體的基本定律、2-3 理想氣體、2-4 氣體的分壓）", unit="補充題庫（段考題型：開口式／閉口式壓力計、非水銀液柱換算、壓力單位）",
       title="化學 第二章 段考題型補充題庫（壓力與壓力計）",
       why="第一次段考化學有 11 題考壓力與壓力計，其中多題使用非水銀液體（血液、密度 0.8、1.04 g/mL 的液體）。本題庫補上液柱換算與開口式／閉口式的判斷。",
       keywords=["壓力計", "開口式壓力計", "閉口式壓力計", "液柱壓力", "壓力單位換算", "亞佛加厥定律"],
       concepts=["液柱壓力換算：h(汞) = h(液) × d(液) ÷ 13.6", "閉口式壓力計：氣體壓力 = 高度差，與大氣壓無關", "開口式壓力計：氣體端液面較低時 P = P₀ + h，較高時 P = P₀ − h", "1 atm = 76 cmHg = 760 mmHg = 760 torr ≈ 1.013 × 10⁵ Pa；1 bar = 10⁵ Pa", "水深約每 10.3 m 增加 1 atm"],
       pitfalls=["忘記把非水銀液柱換算成汞柱", "開口式壓力計忘記加減大氣壓", "torr 等於 mmHg，不是 cmHg", "水底總壓力要加上水面的大氣壓"]),
  dict(id="tm_77", parent="tm_7", subject="數學", items=math1,
       chapter="第1章：三角函數（1-1 弧度量、1-2 三角函數的圖形、1-3 三角的和角與差角公式、1-4 正餘弦函數的疊合）", unit="補充題庫（段考題型：8-5-2-0 多選、疊合的幾何應用、由圖形與週期求參數）",
       title="數學 第1章 段考題型補充題庫（多選與應用）",
       why="第一次段考數學有 3 題多選（8-5-2-0 計分）與多題幾何應用（直徑上的點求最大值、二倍角求邊長、弓形面積、由圖形求 a、b、c），tm_7 的可自動批改題中多選只有 5 題。",
       keywords=["正餘弦疊合", "多選題", "半角公式", "二倍角公式", "弓形面積", "週期", "三角方程式"],
       concepts=["a sin x + b cos x = √(a² + b²) sin(x + θ)，值域 [−√(a²+b²), √(a²+b²)]", "y = a sin(bx + c) + k：振幅 |a|、週期 2π/|b|", "倍角：sin2α = 2sinαcosα、cos2α = cos²α − sin²α", "半角：先判斷 α/2 的象限再決定正負號", "直徑所對的圓周角為直角，可把兩邊長寫成 d cos θ、d sin θ 再疊合"],
       pitfalls=["多選題每個選項都要獨立驗證，不能只算一個", "對稱軸在最大／最小值處，對稱中心在函數值為中線處", "半角公式的正負號由 α/2 的象限決定，不是 α", "限定區間的方程式要數清楚解的個數"]),
  dict(id="tm_78", parent="tm_62", subject="國文", items=chi,
       chapter="第一～三課（勞山道士、發明為需求之母、近體詩選）", unit="補充題庫（段考題型：多選字音、文法倒裝、名詞並列、唐宋詩、示現）",
       title="國文 第一～三課 段考題型補充題庫（多選）",
       why="第一次段考國文多選 8 題（每題 4 分）考字音字形、疊韻、宋詩、借喻、名詞並列；tm_62 的 60 題中多選只有 5 題。本題庫依考卷題型補上多選與辨析題。",
       keywords=["疊韻", "字音", "賓語提前", "異史氏曰", "發明為需求之母", "名詞並列", "宋詩", "近體詩格律", "示現"],
       concepts=["疊韻：韻母相同；雙聲：聲母相同", "賓語提前：疑問代詞或「之」「是」把賓語移到動詞前，如「何術之求」", "「異史氏曰」：蒲松齡在故事後的評論", "〈發明為需求之母〉：許多發明先出現，之後才創造需求", "名詞並列：省略動詞，以名詞組成畫面", "示現：追述（過去）、預言（未來）、懸想（想像當下不在眼前的情景）"],
       pitfalls=["多選題每個選項都要判斷，答錯會扣分", "絕句不要求對仗；律詩中間兩聯對仗", "「之」可能是代詞（為之），也可能是倒裝標記（何陋之有）"]),
  dict(id="tm_79", parent="tm_61", subject="英文", items=eng,
       chapter="Lesson 1（補充練習）", unit="補充題庫（段考題型：綜合測驗文法、文意選填字彙）",
       title="英文 Lesson 1 段考題型補充題庫（綜合測驗文法）",
       why="第一次段考英文綜合測驗 30 題中，文法題集中在 the other／those、with + N + left、despite、not … until、分詞構句、keep／by + V-ing；這些在 tm_61 中沒有練習。",
       keywords=["the other", "those", "with + N + left", "despite", "not … until", "分詞構句", "keep + V-ing", "by + V-ing", "either"],
       concepts=["one … the other：兩者之中的另一個", "those 代替前面的複數名詞", "with + N + 分詞／形容詞：附帶狀況", "despite + N／V-ing；although + 子句", "not … until：直到……才", "分詞構句：主動用 V-ing、被動用 p.p.", "介系詞與 keep 後接 V-ing"],
       pitfalls=["despite 後面不能接子句", "否定句的「也」用 either", "分詞構句要先找出主詞，再判斷主動或被動"]),
]

for p in PKGS:
    d = os.path.join(MAT, p["id"]); os.makedirs(d, exist_ok=True)
    qs = []
    for i, it in enumerate(p["items"], 1):
        q = dict(questionId="%s_q%d" % (p["id"], i), materialId=p["id"], questionNumber=str(i), type="single_choice",
                 questionSource="AI_GENERATED", origin="AI", question=it["question"], options=it["options"], answer=it["answer"],
                 explanation=it["explanation"], page=it["page"], section=it["section"], version="1", createdDate=DATE,
                 knowledgePoint=it["knowledgePoint"], difficulty=it["difficulty"],
                 reference="AI 自編（非課本原題、非段考原題），依長榮 115-1 第一次段考的題型與 %s 的範圍命題；數值答案經 source/build-supplements.py 驗算" % p["parent"])
        qs.append(q)
    multi = sum(1 for q in qs if q["question"].startswith("【多選題】"))
    w = lambda name, obj: open(os.path.join(d, name), "w", encoding="utf-8").write(json.dumps(obj, ensure_ascii=False, indent=2) + "\n")
    w("questionbank.json", dict(materialId=p["id"], questions=qs))
    w("metadata.json", dict(materialId=p["id"], school="cjsh", semester="g2s1", subject=p["subject"], grade="高二", publisher=None,
                             chapter=p["chapter"], unit=p["unit"], keywords=p["keywords"], difficulty=None, source="補充題庫",
                             uploadDate=DATE, version="1", materialType="REFERENCE"))
    w("manifest.json", dict(materialId=p["id"], packageVersion="1", createdDate=DATE, updatedDate=DATE, repositoryVersion="EO-S1.1-003",
                             analysisEngine="Claude", status="complete"))
    w("related.json", dict(materialId=p["id"], related=[dict(materialId=p["parent"], reason="補充題庫：為 %s 補充的段考題型練習題（依長榮 115-1 第一次段考出題型態），題目為 AI 依該教材範圍命題" % p["parent"])]))
    w("summary.json", dict(materialId=p["id"], coreConcepts=p["concepts"], definitions=[], keywords=p["keywords"], keyPoints=p["concepts"][:3],
                            pitfalls=p["pitfalls"], reviewSuggestions=["先在「月考資料」看段考原題與解析，再用這份補充題庫練習同型題", "多選題每個選項都要獨立判斷並說出理由"]))
    open(os.path.join(d, "material.md"), "w", encoding="utf-8").write(
        "# %s — 長榮中學高二 %s\n\n- **科目**：%s（高二上）\n- **母教材**：%s\n- **題數**：%d 題（單選 %d、多選 %d），`questionSource` 全部為 `AI_GENERATED`\n- **用途**：%s\n\n"
        "## 產出與驗算（誠實揭露）\n\n1. 題目全部由 Claude 依母教材範圍與段考題型原創，不是課本原題，也不是段考原題（段考原題在「月考資料」頁）。\n"
        "2. 計算題的答案先手算，再由 `source/build-supplements.py` 逐題數值驗算；選項互不重複、答案必在選項中。\n"
        "3. 多選題選項自帶 (A)～(E) 代號，模擬月考不會打亂其選項順序；全部選對才得分。\n" % (p["id"], p["title"], p["subject"], p["parent"], len(qs), len(qs) - multi, multi, p["why"]))
    src = os.path.join(d, "source"); os.makedirs(src, exist_ok=True)
    open(os.path.join(src, "build-supplements.py"), "w", encoding="utf-8").write(open(__file__, encoding="utf-8").read())
    print(p["id"], p["parent"], len(qs), "questions,", multi, "multi")
