# DeepCurve

<div align="center">

[English](README.md) | **简体中文**

</div>

<p align="center">
  <a href="https://github.com/ruoguli/deepcurve/releases/latest"><img src="https://img.shields.io/github/v/release/ruoguli/deepcurve?label=release&color=2b7bb9" alt="Latest release"></a>
  <a href="https://github.com/ruoguli/deepcurve/releases"><img src="https://img.shields.io/github/downloads/ruoguli/deepcurve/total?color=4c9a2a" alt="Downloads"></a>
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Linux-6e6e6e" alt="Platforms: Windows | Linux">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-DeepCurve%20License-8a5cb8" alt="License"></a>
</p>

<p align="center">
  <img src="docs/images/esp-surface.png" alt="DeepCurve 中映射到分子表面的静电势" width="720">
</p>

**DeepCurve** 是一款面向计算化学与材料模拟的桌面可视化和分析软件。它把分子与晶体结构查看、量化计算结果解析、波函数分析、结构编辑、数据导出及作业工作流集中在同一个应用中。

<!-- release:version -->
当前版本：**0.2.2**（2026-10-27）。
<!-- /release:version -->

软件基于 Tauri（Rust + React）构建，面向 Windows 和 Linux 发布。项目仍处于早期阶段，各平台可用的安装包以[版本发布页](https://github.com/ruoguli/deepcurve/releases)的实际内容为准。

<div align="center">

| 入口 | 地址 |
| --- | --- |
| 🌐 社区网站 | [chat.deepcurve.org](https://chat.deepcurve.org) |
| 💻 代码与发布信息 | [github.com/ruoguli/deepcurve](https://github.com/ruoguli/deepcurve) |
| 👤 作者 | Ruogu Li |

</div>

## 📥 下载

<!-- release:download -->
最新版本：**v0.2.2**，点击文件名即可直接下载。

| 🪟 Windows（64 位） | 🐧 Debian / Ubuntu | 🐧 其他 Linux |
| :---: | :---: | :---: |
| [**deepcurve_0.2.2_x64-setup.exe**](https://github.com/ruoguli/deepcurve/releases/download/v0.2.2/deepcurve_0.2.2_x64-setup.exe) | [**deepcurve_0.2.2_amd64.deb**](https://github.com/ruoguli/deepcurve/releases/download/v0.2.2/deepcurve_0.2.2_amd64.deb) | [**deepcurve_0.2.2_amd64.AppImage**](https://github.com/ruoguli/deepcurve/releases/download/v0.2.2/deepcurve_0.2.2_amd64.AppImage) |

🔐 校验文件：[SHA256SUMS.txt](https://github.com/ruoguli/deepcurve/releases/download/v0.2.2/SHA256SUMS.txt) · 更新说明与历史版本：[版本发布页](https://github.com/ruoguli/deepcurve/releases) · 安装说明：[安装](#-安装)
<!-- /release:download -->

---

## 🔬 DeepCurve 的用途

量化计算软件负责执行计算，DeepCurve 负责查看和分析计算产生的数据。打开结构、输出文件、波函数或网格数据后，可以在三维视图中检查结构和轨道，并在相应的分析面板中查看电子结构、化学键、弱相互作用或光谱结果。它也提供输入文件编辑、结构构建和作业管理功能，让准备、运行和查看计算可以在同一个地方完成。

## ✨ 主要功能

### 🧬 分子与晶体可视化

- 查看分子、生物大分子和周期性晶体结构，可切换球棍、棍或线框等显示方式。
- 旋转、平移和测量结构；选择原子或连通片段，并编辑原子坐标。
- 使用元素选择器和构件库搭建分子，编辑晶胞参数并查看晶体周期结构。
- 显示米勒指数切面、布里渊区和配位多面体等晶体信息。
- 渲染分子轨道、密度和映射曲面，可调节等值面、颜色和材质，并导出适合发表的图像。

### 📈 计算结果

- 解析 ORCA、Gaussian 等程序的输出，浏览几何优化步骤和能量变化，播放振动模式动画。
- 查看与绘制 IR、Raman、UV-Vis、ECD、VCD、NMR 等光谱数据；实际可用内容取决于源文件包含的数据。

### 🌀 波函数分析

波函数分析在后台运行，结果显示在专门的分析面板和三维视图中。

| 类别 | 分析方法 |
| --- | --- |
| 键级 | Mayer、Mulliken、Wiberg、拉普拉斯键级（LBO）、模糊键级（FBO）、IBSI、离域化指数（DI）、多中心键级（MCBO）、自然片段键轨道（NFBO） |
| 弱相互作用 | NCI（RDG）、IGM、IGMH 相互作用分析、修正独立梯度模型（mIGM）、IRI |
| 电子定域化 | ELF、LOL、密度重叠区域指示函数（DORI） |
| 原子电荷 | Hirshfeld、ADCH、CM5 / 1.2×CM5、MBIS、VDD、Becke、Mulliken、Löwdin、SCPA、Stout–Politzer、Bickelhaupt；轨道布居 |
| 表面性质与电荷 | 分子表面静电势（ESP）与局部电子附着能（LEAE）及表面统计、表面极值点，ESP 拟合电荷（CHELPG/RESP），Hirshfeld 表面与指纹图 |
| QTAIM | 临界点搜索与键临界点性质；原子盆电荷、体积与局域化/离域化指数 |
| 概念密度泛函 | 凝聚 Fukui 函数、全局反应性指数、Fukui 函数格点 |
| 芳香性 | HOMA / Bird 指数，自动识别环 |
| 激发态 | 空穴-电子分析、自然跃迁轨道（NTO）、跃迁密度矩阵（TDM）热图 |
| 电子结构 | DOS / PDOS / COHP、VASP 态密度与能带、电子密度差（EDD） |
| 轨道定域化与电荷 | 内禀原子轨道（IAO）电荷、内禀成键轨道（IBO） |
| 磁响应 | 感应电流密度各向异性（AICD）、等化学屏蔽面（ICSS） |
| 信息论 | Shannon 熵、Fisher 信息、Onicescu 信息能、Rényi 熵等原子与分子信息量，信息增益等相对信息量，信息论密度格点 |
| 分子空腔 | 基于等密度面的分子空腔可视化与体积 |

不同分析对输入数据的要求不同。只有原子坐标的文件可以用于结构查看，但无法进行需要基组、轨道或电子密度的分析；缺少数据时，面板会提示所需的文件或数据。

### 🛠️ 结构编辑、导出与计算工作流

- 创建或修改 ORCA、CP2K、Quantum ESPRESSO 等程序的计算输入文件。
- 导出结构、图像、三维模型和网格数据，用于报告或交给其他科学软件处理。
- 在本机 WSL2/Linux、SSH/Linux 主机和 Slurm 集群上提交与管理作业，需要相应的运行环境与账号。
- 配置 Agent 模型服务，并连接用户显式配置的外部 MCP 工具，辅助文件处理和工作流操作。

## 📂 常见文件格式

下表列出 DeepCurve 可以打开的格式及能从中读取的信息，✅ 表示支持。未写软件名的是通用格式。计算输出（`.out` / `.log` / `.abo`）按程序横幅自动识别。应用内的文件选择器会按操作提供相应格式。

| 软件 | 文件格式 | 坐标 | 晶胞 | 分子轨道 | 基函数 / GTF | 多帧 / 轨迹 | 优化曲线 | 振动光谱 | 电子光谱 | NMR | 格点 | DOS / 能带 |
| --- | --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
|  | `.xyz` | ✅ |  |  |  | ✅ |  |  |  |  |  |  |
|  | `.pdb` / `.ent`（含 `.gz`） | ✅ |  |  |  |  |  |  |  |  |  |  |
|  | `.pqr` | ✅ |  |  |  |  |  |  |  |  |  |  |
|  | `.mol` / `.sdf` | ✅ |  |  |  |  |  |  |  |  |  |  |
|  | `.mol2` | ✅ |  |  |  |  |  |  |  |  |  |  |
|  | `.cif` / `.mcif` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
|  | mmCIF / BinaryCIF（`.mmcif`、`.bcif`） | ✅ |  |  |  |  |  |  |  |  |  |  |
|  | `.molden` / `.input` | ✅ |  | ✅ | ✅ |  |  |  |  |  |  |  |
|  | `.wfn` | ✅ |  | ✅ | ✅ |  |  |  |  |  |  |  |
|  | `.wfx` | ✅ |  | ✅ | ✅ |  |  |  |  |  |  |  |
|  | `.cube` / `.cub` | ✅ |  |  |  |  |  |  |  |  | ✅ |  |
|  | OpenDX `.dx` |  |  |  |  |  |  |  |  |  | ✅ |  |
|  | VTK `.vti` |  |  |  |  |  |  |  |  |  | ✅ |  |
| ABACUS | `STRU` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| ABINIT | `.abi` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| ABINIT | `.abo` | ✅ | ✅ |  |  | ✅ | ✅ |  |  |  |  |  |
| ADF | `.run` | ✅ |  |  |  |  |  |  |  |  |  |  |
| ADF | `.out` | ✅ |  |  |  | ✅ | ✅ |  |  |  |  |  |
| AMBER | `.prmtop` / `.parm7` + `.rst7` / `.restrt` / `.inpcrd` | ✅ |  |  |  |  |  |  |  |  |  |  |
| AMBER | `.prmtop` / `.parm7` + `.mdcrd` | ✅ |  |  |  | ✅ |  |  |  |  |  |  |
| CASTEP | `.cell` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| CASTEP | `.castep` | ✅ | ✅ |  |  | ✅ | ✅ |  |  |  |  |  |
| CP2K | `.inp` / `.restart` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| CP2K | `.out` | ✅ | ✅ |  |  | ✅ | ✅ |  |  |  |  |  |
| CREST | `.energies` | ✅ |  |  |  | ✅ |  |  |  |  |  |  |
| CRYSTAL | `.d12` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| CRYSTAL | `.out` | ✅ | ✅ |  |  | ✅ | ✅ |  |  |  |  |  |
| Dalton | `.dal` | ✅ |  |  |  |  |  |  |  |  |  |  |
| Dalton | `.out` | ✅ |  |  |  | ✅ | ✅ | ✅ |  |  |  |  |
| DFTB+ | `.gen` / `.hsd` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| DFTB+ | `.out` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| DMol3 | `.grd` |  |  |  |  |  |  |  |  |  | ✅ |  |
| FHI-aims | `.out` | ✅ |  |  |  | ✅ | ✅ |  |  |  |  |  |
| GAMESS-US | `.gms` | ✅ |  |  |  |  |  | ✅ | ✅ |  |  |  |
| Gaussian | `.gjf` / `.com` | ✅ |  |  |  |  |  |  |  |  |  |  |
| Gaussian | `.log` / `.out` | ✅ |  |  |  | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |
| Gaussian | `.fch` / `.fchk` | ✅ |  | ✅ | ✅ |  |  |  |  |  |  |  |
| GROMACS | `.gro` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| LAMMPS | `.data` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| LAMMPS | `.dump` / `.lammpstrj` | ✅ | ✅ |  |  | ✅ |  |  |  |  |  |  |
| Molcas | `.out` | ✅ |  |  |  |  |  |  |  |  |  |  |
| Molpro | `.molpro` / `.molp` | ✅ |  |  |  |  |  |  |  |  |  |  |
| Molpro | `.out` | ✅ |  |  |  | ✅ | ✅ | ✅ |  |  |  |  |
| Molpro | `.xml` | ✅ |  | ✅ | ✅ |  |  |  |  |  |  |  |
| MOPAC | `.mop` | ✅ |  |  |  |  |  |  |  |  |  |  |
| Multiwfn | `.mwfn` | ✅ |  | ✅ | ✅ |  |  |  |  |  |  |  |
| NBO | `.31` | ✅ |  |  |  |  |  |  |  |  |  |  |
| NWChem | `.nw` | ✅ |  |  |  |  |  |  |  |  |  |  |
| NWChem | `.out` / `.nwout` | ✅ |  |  |  | ✅ | ✅ | ✅ | ✅ |  |  |  |
| OpenMX | `.out` | ✅ | ✅ |  |  | ✅ | ✅ |  |  |  |  |  |
| ORCA | `.inp` | ✅ |  |  |  |  |  |  |  |  |  |  |
| ORCA | `.out` | ✅ |  |  |  | ✅ | ✅ | ✅ | ✅ | ✅ |  |  |
| ORCA | `.hess` | ✅ |  |  |  |  |  | ✅ |  |  |  |  |
| ORCA | `.gbw` / `.uno` / `.unso` / `.uco` / `.qro` / `.loc` / `.nto` / `.mp2nat` / `.nat` | ✅ |  | ✅ | ✅ |  |  |  |  |  |  |  |
| ORCA | `.mkl` | ✅ |  | ✅ | ✅ |  |  |  |  |  |  |  |
| ORCA | orca_2json `.json` | ✅ |  | ✅ | ✅ |  |  |  |  |  |  |  |
| phonopy | `.yaml` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| PSI4 | `.inp` | ✅ |  |  |  |  |  |  |  |  |  |  |
| Q-Chem | `.qcin` | ✅ |  |  |  |  |  |  |  |  |  |  |
| Q-Chem | `.out` / `.qcout` | ✅ |  |  |  | ✅ | ✅ | ✅ | ✅ |  |  |  |
| Qbics | `.inp` | ✅ |  |  |  |  |  |  |  |  |  |  |
| Qbics | `.out` | ✅ |  |  |  | ✅ | ✅ |  |  |  |  |  |
| Quantum ESPRESSO | `.in` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| Quantum ESPRESSO | `.out` | ✅ | ✅ |  |  | ✅ | ✅ |  |  |  |  |  |
| SIESTA | `.fdf` / `.XV` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| SIESTA | `.out` | ✅ | ✅ |  |  | ✅ | ✅ |  |  |  |  |  |
| SIESTA | `.ANI` | ✅ |  |  |  | ✅ |  |  |  |  |  |  |
| Turbomole | `control` / `coord` | ✅ |  |  |  |  |  |  |  |  |  |  |
| Turbomole | `.out` | ✅ |  |  |  | ✅ | ✅ | ✅ | ✅ |  |  |  |
| VASP | `POSCAR` / `CONTCAR` | ✅ | ✅ |  |  |  |  |  |  |  |  |  |
| VASP | `OUTCAR` | ✅ | ✅ |  |  | ✅ | ✅ | ✅ |  |  |  |  |
| VASP | `vasprun.xml` | ✅ | ✅ |  |  | ✅ | ✅ |  |  |  |  | ✅ |
| VASP | `XDATCAR` | ✅ | ✅ |  |  | ✅ | ✅ |  |  |  |  |  |
| VASP | `DOSCAR` / `EIGENVAL` / `PROCAR` |  |  |  |  |  |  |  |  |  |  | ✅ |
| VASP | `CHGCAR` / `CHG` / `ELFCAR` / `LOCPOT` | ✅ | ✅ |  |  |  |  |  |  |  | ✅ |  |
| XMVB | `.xmi` / `.xmo` | ✅ |  |  |  |  |  |  |  |  |  |  |
| xTB | `.out` | ✅ |  |  |  | ✅ | ✅ | ✅ |  |  |  |  |

- Turbomole 与 xTB 的振动光谱读自同目录的 `vibspectrum` 文件；VASP `OUTCAR` 提供频率与振动模式，不含 IR 强度。
- VASP `DOSCAR` / `EIGENVAL` / `PROCAR` 通过"VASP 态密度与能带"对话框从计算目录读取。
- ORCA 二进制轨道文件与 `.mkl` 打开时会在旁边写出 Molden 文件再载入；输出文件的分子轨道取自同目录同名的波函数文件（`.fch`、`.molden` 等）。
- AMBER 坐标与轨迹文件的元素和原子信息取自同一目录下的拓扑文件（`.prmtop` / `.parm7`）。
- DeepCurve 文档（`.qc`）也可以直接打开。

## 💿 安装

在 [GitHub Releases](https://github.com/ruoguli/deepcurve/releases) 下载与操作系统对应的安装包：

| 系统 | 安装包 | 说明 |
| --- | --- | --- |
| Windows（64 位） | `*-setup.exe` | 安装到当前用户目录，无需管理员权限；安装向导会根据系统显示语言自动使用中文或英文。DeepCurve 依赖 Microsoft Edge WebView2，Windows 11 已自带；如果系统中没有，安装程序会从微软官方下载，需要联网（下载失败时安装会中止）。 |
| Linux | `.deb` / `.AppImage` | Debian/Ubuntu 系可安装 `.deb`；其他发行版可以给 `.AppImage` 加上可执行权限后直接运行。 |

如果某个平台在发布页中没有对应的安装包，说明该版本暂未提供这个平台的构建。

从 v0.2.2 起，新版本可以通过应用内的**检查更新**安装。0.2.0 与 0.2.1 无法自动收到这次更新，请手动下载安装一次 v0.2.2，之后的版本会在应用内提示。

## 🚀 快速上手

1. 启动 DeepCurve，通过“打开”或拖放文件载入结构、计算输出、波函数或网格数据。
2. 在菜单或分析面板中选择需要的操作；如果输入数据不满足要求，面板会提示所需的文件或数据类型。
3. 完成分析后，在结果面板查看数据，并使用相应的导出功能保存结果。

### 🖱️ 三维视图操作

| 操作 | 效果 |
| --- | --- |
| 鼠标左键拖动 | 旋转视图 |
| 鼠标右键拖动 | 平移视图 |
| `Ctrl` + 鼠标左键拖动 | 移动结构中的原子 |
| `Ctrl` + 鼠标右键拖动 | 平移结构 |
| 双击原子 | 选择与其相连的片段 |

## 🤖 Agent、API Key 与外部程序

Agent 需要配置模型服务和 API Key；第三方模型服务可能按其服务条款收费。API Key 保存在系统钥匙串中，不会以明文写入设置文件。Agent 可以联网搜索，既可以使用模型服务商的原生搜索，也可以使用内置的搜索工具。

DeepCurve 不替代 ORCA、Gaussian、CP2K 等计算引擎，也不随应用提供所有可选的外部计算程序。需要调用外部程序或连接远程主机时，请自行准备相应的软件、账号和凭据。外部 MCP 工具需要在设置中显式配置后才会启用。

## 🆕 当前版本更新

<!-- release:notes -->
**v0.2.2** 的主要更新：

- 修复了读取 .molden 文件存在的潜在问题以及与 .wfx/.wfn 文件转换之间的问题。
- 支持直接读取 ORCA 生成的 .gbw 文件。该功能不依赖 orca_2mkl；由于 .gbw 不是公开格式，随 ORCA 版本变化可能存在兼容性问题，仍建议使用 orca_2mkl 将 .gbw 转换为 .molden 文件。
- 兼容了旧版本 ORCA 输出文件的读取，优化了 Gaussian 输出文件的读取。
- 分析菜单新增了原子电荷模块，支持 Hirshfeld、ADCH、CM5（及 1.2×CM5）、MBIS、VDD、Becke、Mulliken、Löwdin、SCPA、Stout–Politzer 与 Bickelhaupt 电荷，以及轨道布居分析。
- 分析菜单新增了 QTAIM 拓扑分析模块，可搜索临界点并通过键临界点性质判断成键类型。
- 分析菜单新增了 QTAIM 原子盆模块，可计算原子盆电荷、体积以及局域化/离域化指数（LI/DI）。
- 分析菜单新增了概念密度泛函（CDFT）模块，可计算凝聚 Fukui 函数、全局反应性指数以及 Fukui 函数格点。
- 分析菜单新增了 Hirshfeld 表面模块，提供按元素对统计的接触面积与指纹图。
- 分析菜单新增了密度重叠区域指示函数（DORI）模块。
- 芳香性子菜单新增了 HOMA / Bird 芳香性模块，可自动识别环，并支持任意结构文件。
- 分析菜单新增了自然跃迁轨道（NTO）模块，可一次计算全部激发态并支持开壳层体系。
- 分析菜单新增了跃迁密度矩阵热图模块。
- 静电势（ESP）与局部电子附着能（LEAE）表面分析新增了表面统计与表面极值点结果面板。
- 支持绘制 VASP 得到的态密度与能量信息，并支持显示自旋密度信息。

更多变更以应用内的更新说明和[版本发布页](https://github.com/ruoguli/deepcurve/releases)为准。
<!-- /release:notes -->

## 💬 反馈与支持

- 问题反馈与功能建议：[GitHub Issues](https://github.com/ruoguli/deepcurve/issues)
- 使用交流：[chat.deepcurve.org](https://chat.deepcurve.org)

反馈问题时，请尽量附上软件版本、操作系统、复现步骤，以及可以公开的示例文件。

## ⚠️ 使用边界

计算分析结果应结合原始计算设置和科学文献进行检查。DeepCurve 不能保证所有输入文件或分析结果都适用于每一种研究情形，重要结果请用相应的专业程序或独立方法复核。第三方组件及其许可信息可在应用内查看。将本软件用于研究或发表时，请合理引用本软件及所用分析方法的原始文献。

## 📄 许可

DeepCurve 依据 [DeepCurve 软件使用许可协议](LICENSE)（英文正式文本）发布。第三方组件适用其各自的许可，可在应用内“帮助 → 关于 → 构成DeepCurve的第三方组件”中查看。
