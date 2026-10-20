# DeepCurve

**English** | [简体中文](README.zh-CN.md)

<p align="center">
  <img src="docs/images/esp-surface.png" alt="Electrostatic potential mapped onto the molecular surface in DeepCurve" width="720">
</p>

**DeepCurve** is a desktop application for visualizing and analyzing results from computational chemistry and materials simulations. It brings molecular and crystal structure viewing, quantum chemistry output parsing, wavefunction analysis, structure editing, data export and job workflows together in a single application.

Current version: **0.2.0** (2026-10-16). DeepCurve is built with Tauri (Rust + React) and targets Windows, macOS and Linux. The project is at an early stage; the installers actually attached to the [Releases page](https://github.com/ruoguli/deepcurve/releases) are the authoritative list of supported platforms.

| Resource | Link |
| --- | --- |
| Community | [chat.deepcurve.org](https://chat.deepcurve.org) |
| Source and releases | [github.com/ruoguli/deepcurve](https://github.com/ruoguli/deepcurve) |
| Author | Ruogu Li |

## Contents

- [What DeepCurve is for](#what-deepcurve-is-for)
- [Features](#features)
- [Supported file formats](#supported-file-formats)
- [Installation](#installation)
- [Getting started](#getting-started)
- [Agent, API keys and external programs](#agent-api-keys-and-external-programs)
- [What's new](#whats-new)
- [Feedback and support](#feedback-and-support)
- [Limitations](#limitations)
- [License](#license)

## What DeepCurve is for

Quantum chemistry packages run the calculations; DeepCurve helps you inspect and analyze the data they produce. Open a structure, an output file, a wavefunction or volumetric data to examine geometries and orbitals in 3D, then use the analysis panels to study electronic structure, chemical bonding, weak interactions or spectra. DeepCurve also provides input file editing, structure building and job management, so that preparing, running and reviewing a calculation can happen in one place.

## Features

### Molecular and crystal visualization

- View molecules, biomacromolecules and periodic crystals in ball-and-stick, stick or wireframe styles.
- Rotate, pan and measure structures; select atoms or connected fragments and edit atomic coordinates.
- Build molecules with the element picker and fragment library; edit lattice parameters and view periodic images.
- Display Miller-index planes, Brillouin zones and coordination polyhedra.
- Render molecular orbitals, densities and mapped surfaces with adjustable isovalues, colors and materials, and export publication-quality images.

### Calculation results

- Parse outputs from ORCA, Gaussian and other programs; browse optimization steps and energy profiles, and animate vibrational modes.
- View and plot IR, Raman, UV-Vis, ECD, VCD and NMR spectra; what is available depends on the data contained in the source file.

### Wavefunction analysis

Wavefunction analyses run in the background and show their results in dedicated panels and in the 3D view.

| Category | Analyses |
| --- | --- |
| Bond orders | Mayer, Mulliken, Wiberg, Laplacian (LBO), fuzzy (FBO), IBSI, delocalization index (DI), multicenter bond order (MCBO), natural fragment bond orbitals (NFBO) |
| Weak interactions | NCI (RDG), IGM, IGMH interaction analysis, modified IGM (mIGM), IRI |
| Electron localization | ELF, LOL |
| Surface properties and charges | Electrostatic potential (ESP) on molecular surfaces, local electron affinity energy (LEAE), ESP-fitted charges (CHELPG/RESP) |
| Excited states | Hole–electron analysis |
| Electronic structure | DOS / PDOS / COHP, electron density difference (EDD) |

Each analysis has its own input requirements. A file that only contains atomic coordinates is enough for structure viewing, but not for analyses that need a basis set, orbitals or electron density. If something is missing, the panel tells you which file or data is required.

### Structure editing, export and workflows

- Create and edit input files for ORCA, CP2K, Quantum ESPRESSO and other programs.
- Export structures, images, 3D models and volumetric data for reports or for use in other scientific software.
- Submit and manage jobs on local WSL2/Linux, SSH/Linux hosts and Slurm clusters, which require the corresponding environment and accounts.
- Configure an Agent model service and connect external MCP tools that you explicitly set up, to assist with file handling and workflows.

## Supported file formats

The table lists representative formats. Read/write support and the available analyses differ by format, and the file dialogs in the app offer the formats relevant to each action. For some formats only the coordinates can be read at the moment; support is being extended.

| Data type | Example formats |
| --- | --- |
| Molecular and biological structures | `.xyz`, `.pdb`, `.mol`, `.mol2` |
| Crystal and periodic structures | `.cif`, VASP `POSCAR` / `CHGCAR`, ABACUS `STRU`, Quantum ESPRESSO `.in`, CP2K `.inp` / `.restart` |
| Calculation inputs | ORCA `.inp`, Gaussian `.gjf` / `.com`, MOPAC `.mop`, PSI4 `.inp` |
| Calculation outputs | ORCA `.out` / `.hess`, Gaussian `.out` / `.log`, orca_2json `.json` |
| Wavefunctions | `.molden` / `.input`, `.fch` / `.fchk`, `.wfn`, `.wfx`, `.mwfn` |
| Volumetric and orbital data | `.cube` / `.cub` |
| Other | XMVB `.xmi` / `.xmo`, Qbics `.inp` / `.out` |

## Installation

Download the installer for your operating system from [GitHub Releases](https://github.com/ruoguli/deepcurve/releases):

| OS | Package | Notes |
| --- | --- | --- |
| Windows (64-bit) | `*-setup.exe` | Installs for the current user and does not require administrator rights. The installer appears in English or Simplified Chinese according to the Windows display language. DeepCurve uses Microsoft Edge WebView2, which ships with Windows 11; if it is missing, the installer downloads it from Microsoft, which requires an internet connection (installation stops if the download fails). |
| Linux | `.deb` / `.AppImage` | Install the `.deb` on Debian/Ubuntu-based systems; on other distributions, make the `.AppImage` executable and run it. |
| macOS | `.dmg` | Open it and drag DeepCurve into the Applications folder. |

If a platform has no package on the Releases page, no build is available for it in that version yet.

## Getting started

1. Launch DeepCurve and load a structure, calculation output, wavefunction or volumetric file with **Open** or by drag and drop.
2. Choose an action from the menus or analysis panels. If the input does not provide what an analysis needs, the panel tells you which file or data type is required.
3. Review the results in the result panel and save them with the corresponding export function.

### 3D view controls

| Action | Effect |
| --- | --- |
| Left-drag | Rotate the view |
| Right-drag | Pan the view |
| `Ctrl` + left-drag | Move atoms in the structure |
| `Ctrl` + right-drag | Translate the structure |
| Double-click an atom | Select its connected fragment |

## Agent, API keys and external programs

The Agent requires a model service and an API key; third-party model services may charge according to their own terms. API keys are stored in the operating system keychain and are never written to the settings file in plain text. The Agent can also search the web, either through the model provider's native search or through a built-in search tool.

DeepCurve does not replace computational engines such as ORCA, Gaussian or CP2K, and it does not bundle every optional external program. To run external programs or connect to remote hosts, provide the necessary software, accounts and credentials yourself. External MCP tools are only enabled after you configure them explicitly in Settings.

## What's new

Highlights of **v0.2.0**:

- The application was renamed to DeepCurve, and the Agent gained a thinking mode.
- A unified interface style and a dark mode.
- Basic molecule building and faster loading of `.cube` files.
- Miller-index planes, Brillouin zone visualization and coordination polyhedra.
- Improved SSH private-key connections.

See the in-app release notes and the [Releases page](https://github.com/ruoguli/deepcurve/releases) for the full list of changes.

## Feedback and support

- Bug reports and feature requests: [GitHub Issues](https://github.com/ruoguli/deepcurve/issues)
- Discussion: [chat.deepcurve.org](https://chat.deepcurve.org)

When reporting a problem, please include the DeepCurve version, your operating system, steps to reproduce and, if possible, an example file you can share publicly.

## Limitations

Check analysis results against the original calculation settings and the scientific literature. DeepCurve cannot guarantee that every input file or analysis is appropriate for every research scenario; verify important results with dedicated programs or independent methods. Third-party components and their licenses can be viewed inside the application. If you use DeepCurve in research or publications, please cite the software and the original literature of the analysis methods you use.

## License

DeepCurve is distributed under the [DeepCurve Software License Agreement](LICENSE). Third-party components are subject to their own licenses, which can be viewed in the application under **Help → About → Third-Party Components That Make Up DeepCurve**.
