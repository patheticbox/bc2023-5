const express = require("express");
const bodyparser = require("body-parser");
const app = express();
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: true}));
const fs = require("fs");
const multer = require("multer");
const upload = multer();
app.use("/", express.static("html"));
// html форма UploadForm
app.get("/UploadForm.html", function (req,res) {
    res.sendFile(__dirname + '/UploadForm.html');
});

// Вивід JSON файлу з нотатками
app.get ("/notes", function (req, res) {

    fs.readdir("notes", (err, files) => {
        let notes = [];

        // якщо папка notes пуста
        if (files.length === 0) {
           const emptyJson = [];
           fs.writeFileSync("notes.json", JSON.stringify(emptyJson, null, 2));
           res.status(200).json(emptyJson);
        } else {
        // якщо нотатки є
        try {
        const data = fs.readFileSync("notes.json", 'utf-8');
        notes = JSON.parse(data);
        } catch (err) {
        console.error("Error while reading JSON file: " + err.message);
        }
        res.json(notes);
        }
    });
    
});

// створення нової нотатки
app.post("/upload", upload.fields([{ name: "note_name" }, { name : "note" }]), function (req, res) {
    const noteName = req.body.note_name;
    const noteContent = req.body.note;

    const jsonFile = "notes.json";
    let notes = [];
    
    // запис у змінну notes даних з notes.json
    try {
        const data = fs.readFileSync(jsonFile, 'utf-8');
        notes = JSON.parse(data);
    } catch (err) {
        res.status(400).send("Failed to write data in json file!");
    }

    // якщо нотатка існує
    if (noteExists(noteName)) {
        res.status(400).send("Note with the same name already exists!");
    } else {
    // якщо такої нотатки немає
    const filePath = `notes/${noteName}.txt`;
    fs.writeFileSync(filePath, noteContent);
    // запис у notes нових даних
    notes.push({ name: noteName, content: noteContent });

    // запис у файл notes.json нових даних
    fs.writeFileSync(jsonFile, JSON.stringify(notes, null, 2));
    res.status(201).send("Note uploaded!");
    }
});

// вивід нотатки у запиті
app.get("/notes/:noteName", function (req, res) {
    const noteName = req.params.noteName;
    const filePath = `notes/${noteName}.txt`;
    // якщо нотатка є
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        res.end(data);
    } else {
        // якщо такої нотатки немає
        res.status(404).end("File doesn't exist!");
    }
})

// редагування змісту нотатки
app.put("/notes/:noteName", upload.fields([{ name: "extra" }]), function (req, res) {
    const noteName = req.params.noteName;
    const newNoteContent = req.body.extra;

    const filePath = `notes/${noteName}.txt`;
    // перевірка, чи файл існує
    if (fs.existsSync(filePath)) {
        // редагування вмісту нотатки
        fs.writeFileSync(filePath, newNoteContent, 'utf-8');

        // оновлення JSON-файлу
        const jsonFile = "notes.json";
        let notes = [];

        if (fs.existsSync(jsonFile)) {
            try {
                const data = fs.readFileSync(jsonFile, 'utf-8');
                notes = JSON.parse(data);

                // знаходимо індекс нотатки, яку редагуємо
                const index = notes.findIndex((note) => note.name === noteName);

                if (index !== -1) {
                    // оновлюємо поле "content" цієї нотатки
                    notes[index].content = newNoteContent;
                }

                // зберігаємо оновлений масив в JSON-файл
                fs.writeFileSync(jsonFile, JSON.stringify(notes, null, 2));
            } catch (err) {
                console.error("Error while reading or updating the JSON file: " + err.message);
                res.status(500).end("Internal Server Error");
                return;
            }
        }

        res.status(200).end("Note updated successfully");
    } else {
        // якщо такої нотатки немає
        res.status(404).end("File doesn't exist!");
    }
});

// видалення нотатки
app.delete("/notes/:noteName", function (req, res) {
    const noteName = req.params.noteName;
    const filePath = `notes/${noteName}.txt`;

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Видалення файлу

        // Оновлюємо JSON-файл notes.json
        const jsonFile = "notes.json";
        let notes = [];

        if (fs.existsSync(jsonFile)) {
            try {
                const data = fs.readFileSync(jsonFile, 'utf-8');
                notes = JSON.parse(data);
            } catch (err) {
                console.error("Error while reading JSON file: " + err.message);
            }
        }

        // Видаляємо нотатку з масиву notes
        const index = notes.findIndex((note) => note.name === noteName);
        if (index !== -1) {
            notes.splice(index, 1);
        }

        // Зберігаємо оновлений масив в JSON-файл
        fs.writeFileSync(jsonFile, JSON.stringify(notes, null, 2));

        res.status(204).send("Note deleted!");
    } else {
        res.status(404).send("Note not found");
    }
});

// перевірка, чи нотатка існує
function noteExists(noteName) {
    const notePath = `notes/${noteName}.txt`;
    if (fs.existsSync(notePath)) {
        return true;
    } else return false;
}

app.listen(8000, () => {
    console.log("server is running on port 8000!");
});