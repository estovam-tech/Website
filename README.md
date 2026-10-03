# Estovam Tech website

The site for [estovam.tech](https://estovam.tech).
Plain HTML, CSS and JS on GitHub Pages.
No frameworks, no build step, no npm.

## View it locally
Open any `index.html` in your browser.
Or run `python3 -m http.server` in this folder and open http://localhost:8000.
You can also review a page with Lavish: `lavish-axi <path/to/page.html>`.

## Add a page, a post or a robot
1. Copy the right template folder: `_template/` for a page, `blog/_template/` for a post, `robots/_template/` for a robot.
2. Rename the copy.
3. Edit only between the `EDIT` and `/EDIT` comments, plus the title.
4. List it: add a line to the `nav` list in `assets/js/site.js` for a page, or a row to the table in `blog/index.html` or `robots/index.html`.
5. Open it in a browser and check it, then send it through a pull request.

## Folders
- `assets/` - shared CSS, JS, images and the 3D model
- `_docs/style-sheet.html` - the design rules and components
- `about/`, `robots/`, `blog/` - one folder per page

See `AGENTS.md` for the full rules.
