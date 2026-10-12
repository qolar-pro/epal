# Β΄ ΕΠΑΛ Πληροφορική – study site

An interactive study site (in Greek) for the six textbooks of the **Β΄ Εσπερινού ΕΠΑ.Λ., Τομέας Πληροφορικής**:
short notes, term lists, quizzes, flashcards, a mixed test, search, and seven interactive tools
(base converter, two's complement, image/sound size, UTF-8, `range()`, CPU scheduling, HTML/CSS lab).

It is a plain static site: no build step, no dependencies, no external fonts or CDNs. It works offline once loaded.
Progress (finished chapters, best quiz scores, test history, "don't know" flashcards) is stored in the browser's `localStorage` only.

> Short study notes, not a replacement for the official books. Check the syllabus with your teacher.

## Run locally

Open `index.html` in a browser, or serve the folder: `python3 -m http.server`.

## Structure

```
index.html  style.css  app.js  tools.js
data/d1.js … d6.js     one file per course
```

Each course file pushes onto the global `COURSES` array:

```js
COURSES.push({
  id, title, short, hue, intro,        // hue: a number 0-360 (anything else falls back to a default)
  chapters: [{
    id, title,
    notes: `<h4>…</h4><p>…</p>`,        // HTML: h4, p, ul/ol, table, pre>code, <p class="tip">
    terms: [["Όρος", "Ορισμός"]],       // 4–8 per chapter
    quiz:  [{ q, o: [4 options], a: indexOfCorrect, e: "explanation" }]   // 5–6 per chapter
  }]
});
```

To add a course, create `data/d7.js` and add a `<script>` tag for it in `index.html`.
Quiz options are shuffled when shown, so the position of `a` in the data does not matter.

## Deploy (Vercel)

No configuration is needed (`vercel.json` only enables clean URLs).
Import the GitHub repository in Vercel with the "Other" framework preset, no build command and no output directory,
or run `vercel --prod` from this folder.

## Content provenance

All notes are written from the syllabus and general knowledge, **not** copied from the textbooks.
The books themselves could not be read while writing, so **every chapter was written without the book in front of the author**.

- Course 1 (`d1.js`) is the reference file supplied by the project owner.
- Course 2 follows the Python 2.7 behaviour of the book (integer division, `raw_input`) and notes where Python 3 differs.
  The second half of the book (strings, files, further structures) is not covered.
- Course 4: the excluded sections 3.2.2, 4.4, 5.2.5, 5.2.6, 6.1.3 could not be identified without the book, so they are not removed.
- Course 6: chapters 1.2, 3, 4.5 and 6 are intentionally not written.

Please verify all of this with your teacher.
