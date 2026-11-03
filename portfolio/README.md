# VentureScope portfolio kit

<!-- Made by pnpm portfolio:texts. To change the text, edit portfolio/profile.json or scripts/portfolio/pages.json and run the command again. -->

Made on 2026-10-24. Everything in this folder was made by  pnpm portfolio  from the running demo. The data is fictional (the Orbit Analytics sample company).

## What is here

| Path | What it is |
| --- | --- |
| gallery.html | Open it in a browser to see every picture, filter them and copy alt texts |
| screenshots/desktop | 53 pictures of the pages, light theme, 1440 x 900, 2x sharp |
| screenshots/desktop/*-full.png | 18 full-page pictures of the long pages |
| screenshots/dark | 10 pictures with the dark theme |
| screenshots/mobile | 8 pictures on a phone screen (390 wide) |
| exports | exports/executive-report.pdf, exports/forecast.csv, exports/model-backup.json |
| texts/project-summary.md | Short, medium and long descriptions, key facts, tags |
| texts/case-study.md | The full story of the project, ready to edit |
| texts/captions.md and captions.csv | A caption, what to notice and an alt text for every picture |
| texts/features.md | The feature list |
| texts/tech-stack.md | Technologies, versions and architecture notes |
| texts/posts.md | LinkedIn post, short thread, GitHub description and topics, blog introduction |
| texts/cv-bullets.md | CV bullets and short entries |
| texts/demo-video-script.md | A 3 minute script that follows the pictures |
| texts/interview-qa.md | Nine questions with draft answers |
| profile.json | Your name and links. Edit it, then run  pnpm portfolio:texts |
| manifest.json | A list of every picture and how it went |

## Numbers from the project

| Fact | Value |
| --- | --- |
| Pages | 52 (8 public, 7 app shell, 37 model pages) |
| API routes | 10 |
| Database models | 24 tables and 4 enums |
| Migrations | 16 |
| Lines of TypeScript (app, components, lib) | 131,158 |
| Unit test files | 282 |
| Browser test files | 32 |
| npm scripts | 62 |

## Checklist before you publish

- [ ] Write your name and links in portfolio/profile.json, then run  pnpm portfolio:texts
- [ ] Add the address of your GitHub repository (githubUrl)
- [ ] Optional: put a read-only copy online and add its address (liveUrl)
- [ ] Record the demo video (see texts/demo-video-script.md) and add its address (videoUrl)
- [ ] Open gallery.html and look at every picture. Retake a page with  pnpm portfolio:shots --only=name
- [ ] Read texts/case-study.md and change the parts marked as yours (why you built it, what you learned)
- [ ] Read texts/interview-qa.md and write answer 9 in your own words
- [ ] Copy the best 6 to 8 pictures into your portfolio site, with the captions and alt texts
- [ ] Put 2 or 3 pictures at the top of the README of the repository
- [ ] Check that no real secrets are in the pictures or in .env files that you commit

## Commands

    pnpm portfolio                         pictures and texts (starts the app if it is not running)
    pnpm portfolio:shots --only=forecast   retake some pictures (names are in scripts/portfolio/pages.json)
    pnpm portfolio:shots --quick           only the normal desktop pictures
    pnpm portfolio:texts                   write the texts again (after you edit profile.json)

Settings: PORTFOLIO_URL (default http://localhost:3000), PORTFOLIO_SCALE (1 to 3, default 2), PORTFOLIO_SETTLE_MS (default 1800).
