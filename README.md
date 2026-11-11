# Never Let Me Go — The Revision Room

A bilingual English–Chinese study companion to Kazuo Ishiguro’s *Never Let Me Go*. The guide contains original summaries and analysis, brief quotations, and linked reading references. It covers the whole novel, including the ending. The Chapters 1–9 quiz and its reference sheet stay within Part One.

## What is included

- **23 expanded chapter guides** with overviews, 78 bilingual scene walkthroughs, factual detail cards, close analysis, common misreadings and recall questions.
- **English, bilingual and Chinese-primary reading modes**, with Chinese explanations retaining key English literary terms.
- **60 bilingual Chapters 1–9 multiple-choice questions**, covering background, names, objects, events and interpretation. Filter by chapter or type, choose practice or test mode, and retry missed questions.
- **30 bilingual flashcards**, a 20-question whole-novel quiz, six essay workshops, character studies, themes, literary methods, symbolism and context.
- **Browser-local notes and progress**, saved quiz sessions, essay draft downloads, and print layouts.

The site is independent study material, not the novel’s full text or an official examination-board resource. The supplied EPUB was used to check facts and is not included in this repository.

## Run locally

The website is static: it needs no application dependencies or build step. With Python 3 installed, run:

```sh
python3 -m http.server 4173 --directory dist
```

Open [http://localhost:4173](http://localhost:4173). A local HTTP server is needed because the application loads its study data with `fetch()`.

The interface uses Google Fonts when available, with system-font fallbacks. Notes and progress are saved in this browser, not synced to another device. Moving between hosting addresses creates a separate browser-storage location; use the export options to keep a copy of your work.

## Project structure

```text
dist/
  index.html        Site entry point
  app.js            Navigation, reading modes and revision interactions
  style.css         Desktop, mobile and print styles
  data/             Chapter, analysis, practice and bilingual content
checks/
  validate.cjs      Content and interaction checks
.github/workflows/
  deploy.yml        GitHub Pages publishing workflow
```

## Checks

The development checks require Node.js 26 or later and the pinned `jsdom` dependency:

```sh
npm install
npm run check
npm test
```

The checks cover chapter completeness, source references, quiz structure and scoring, chapter filters, answer concealment in test mode, wrong-answer retry, saved writing, language switching, navigation and search. They use an in-memory DOM and do not replace visual browser checks.

If `jsdom` is installed outside the project, `NLMG_JSDOM_PATH` can point to its module directory.

## GitHub Pages

The included workflow publishes only `dist/`, with no build step. In the repository’s **Settings → Pages**, choose **GitHub Actions** as the source. Pushes to `main` and manual workflow runs then deploy the site to GitHub Pages.

Repository creation, visibility and Pages activation are separate publishing choices; this export does not enable them by itself. The existing private Sites deployment is independent of this repository.

The workflow follows GitHub’s [custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
