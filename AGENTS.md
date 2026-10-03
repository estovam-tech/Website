# Estovam Tech website - rules for Tyler and any AI agent

## What the site is
Plain HTML, CSS and JS served by GitHub Pages at estovam.tech.
No frameworks, no build step, no npm.
Everything must stay readable and hand-editable.

## What each page is for
- `index.html` - Home. The pitch: scroll hero, three principles, renders, the live 3D model.
- `about/index.html` - About. Intro, story, three principles, milestones.
- `robots/index.html` - Robots. The featured robot and a table of every robot.
- `robots/rev-03/index.html` - One robot page. Specs, live 3D model, parts table, notes.
- `blog/index.html` - Blog. The featured post and a table of all posts, newest first.
- `blog/robot-build-log/index.html` - One blog post. The robot build log.
- `404.html` - Shown by GitHub Pages for any broken URL.

## Where things live
- `assets/css/es.css` - Shared styles: tokens, every `es-` component, `.es-prose`, `.es-todo`. Loaded by every page.
- `assets/css/home.css` - Home-only effects: scroll reveal, compare slider, split-flap text, lightbox.
- `assets/js/site.js` - On every page. The nav list and the contact link are at the top. It draws the header, bottom bar, phone menu, footer and clock.
- `assets/js/home.js` - Home-only effects behind `home.css`.
- `assets/js/viewer.js` - The 3D viewer. Used on Home and on robot pages.
- `assets/models/robot-model.js` - The 3D model as a `.js` file that sets `window.ROBOT_MODEL`. Generated data, do not hand-edit.
- `assets/img/` - Every image and logo.
- `_docs/style-sheet.html` - The style sheet. The design source of truth for tokens and components.
- `_template/`, `blog/_template/`, `robots/_template/` - Copy these to start a new page, post or robot.

## How to add a page
1. Copy `_template/` to a new folder at the site root, for example `careers/`.
2. Open the new `index.html`. Edit the `<title>`, the description, `data-hud` in the header, and only the part between the `EDIT` and `/EDIT` comments.
3. Add `{ label: "Careers", path: "careers/" }` to the `nav` list at the top of `assets/js/site.js`.
4. Review it with Lavish (see below).

## How to add a blog post
1. Copy `blog/_template/` to `blog/<post-name>/`.
2. Edit the title, the description and the part between `EDIT` and `/EDIT`.
3. Add a row at the top of the table in `blog/index.html`, newest first, and renumber the rows.
4. If it is the most important post, update the featured block in `blog/index.html` too.

## How to add a robot
1. Copy `robots/_template/` to `robots/<robot-name>/`.
2. Edit the title, the description, `data-hud` and the part between `EDIT` and `/EDIT`.
3. Add a row to the table in `robots/index.html`, and update the featured block there if this is now the current robot.
4. If the robot has no 3D model yet, delete the viewer section and the viewer scripts from the new page.

## Rules
- Use relative paths only, for example `../assets/css/es.css`.
  The one exception is `404.html`, which uses root paths because GitHub Pages serves it at any URL.
  Keep new pages at the same depth as their template so the paths keep working.
- Use the `es-` components from `_docs/style-sheet.html`.
  Check it before you add or change any style.
  Use `.es-prose` for long reading text.
- Put a style in `es.css` only if more than one page uses it.
  A style used by one page belongs in that page's own CSS file.
- Use token colors only, for example `var(--ink)`.
  Never hard-code a color.
  This keeps a light theme possible later.
- Dark theme only for now.
- Mark every placeholder with `class="es-todo"`.
  Remove the class when the text is real.
  Search for `es-todo` to list what is left.
- Brand voice: plain sentences, HUD lines separated by `//`, actions end in `+`, no emoji, no exclamation marks.
  The tagline "Precise. Efficient. Autonomous." appears once, in the home hero.
- The robot has no name yet.
  Write "Robot name" and mark it `es-todo`.
  The About page has no real names yet.
- Contact is LinkedIn.
  The link is set once, in `assets/js/site.js`.
- Never use the em dash.
  Use a plain dash.

## Review workflow with Lavish
After you edit a page, run `lavish-axi <path/to/page.html>`.
Then run `lavish-axi poll <path/to/page.html>` and apply the feedback.
Never commit a page change without a Lavish review.
Lavish only serves the folder that holds the page.
For a page in a subfolder, make a temporary copy at the site root with the asset paths changed from `../assets/` to `assets/`.
Delete the copy when the review is done.
Do not commit it.

## Git
Work on a branch and open a pull request.
Never push to main.
