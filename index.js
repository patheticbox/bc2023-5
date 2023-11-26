const express = require("express");
const bodyparser = require("body-parser");
const app = express();
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: true}));
const fs = require("fs");
const multer = require("multer");
const upload = multer();
app.use("/", express.static("html"));

app.get("/UploadForm.html", function (req,res) {
    res.sendFile(__dirname + '/UploadForm.html');
});


app.get ("/notes", function (req, res) {

    fs.readdir("notes", (err, files) => {
        let notes = [];

       
        if (files.length === 0) {
           const emptyJson = [];
           fs.writeFileSync("notes.json", JSON.stringify(emptyJson, null, 2));
           res.status(200).json(emptyJson);
        } else {
 
        try {
        const data = fs.readFileSync("notes.json", 'utf-8');
        notes = JSON.parse(data);
        } catch (err) {
        console.error(": " + err.message);
        }
        res.json(notes);
        }
    });
    
});

app.post("/upload", upload.fields([{ name: "note_name" }, { name : "note" }]), function (req, res) {
    const noteName = req.body.note_name;
    const noteContent = req.body.note;

    const jsonFile = "notes.json";
    let notes = [];
    

    try {
        const data = fs.readFileSync(jsonFile, 'utf-8');
        notes = JSON.parse(data);
    } catch (err) {
        res.status(400).send("Не вдалося записати дані до нотатки!");
    }

    
    if (noteExists(noteName)) {
        res.status(400).send("Нотатка з такою назвою вже існує!");
    } else {
   
    const filePath = `notes/${noteName}.txt`;
    fs.writeFileSync(filePath, noteContent);
    
    notes.push({ name: noteName, content: noteContent });

  
    fs.writeFileSync(jsonFile, JSON.stringify(notes, null, 2));
    res.status(201).send("Нотатку оновлено!");
    }
});


app.get("/notes/:noteName", function (req, res) {
    const noteName = req.params.noteName;
    const filePath = `notes/${noteName}.txt`;

    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        res.end(data);
    } else {
        res.status(404).end("Нотатки нема!");
    }
})


app.put("/notes/:noteName", upload.fields([{ name: "extra" }]), function (req, res) {
    const noteName = req.params.noteName;
    const newNoteContent = req.body.extra;

    const filePath = `notes/${noteName}.txt`;
    
    if (fs.existsSync(filePath)) {
      
        fs.writeFileSync(filePath, newNoteContent, 'utf-8');

        
        const jsonFile = "notes.json";
        let notes = [];

        if (fs.existsSync(jsonFile)) {
            try {
                const data = fs.readFileSync(jsonFile, 'utf-8');
                notes = JSON.parse(data);

            
                const index = notes.findIndex((note) => note.name === noteName);

                if (index !== -1) {
                    
                    notes[index].content = newNoteContent;
                }

                
                fs.writeFileSync(jsonFile, JSON.stringify(notes, null, 2));
            } catch (err) {
                console.error("Помилка при спробі зчитування або редагування файла: " + err.message);
                res.status(500).end("Помилка сервера");
                return;
            }
        }

        res.status(200).end("Нотатку успішно оновлено");
    } else {

        res.status(404).end("Нотатки не існує!");
    }
});


app.delete("/notes/:noteName", function (req, res) {
    const noteName = req.params.noteName;
    const filePath = `notes/${noteName}.txt`;

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); 

        
        const jsonFile = "notes.json";
        let notes = [];

        if (fs.existsSync(jsonFile)) {
            try {
                const data = fs.readFileSync(jsonFile, 'utf-8');
                notes = JSON.parse(data);
            } catch (err) {
                console.error("Помилка при спробі зчитування файла: " + err.message);
            }
        }

   
        const index = notes.findIndex((note) => note.name === noteName);
        if (index !== -1) {
            notes.splice(index, 1);
        }

       
        fs.writeFileSync(jsonFile, JSON.stringify(notes, null, 2));

        res.status(204).send("Нотатку видалено!");
    } else {
        res.status(404).send("Нотатку не знайдено");
    }
});


function noteExists(noteName) {
    const notePath = `notes/${noteName}.txt`;
    if (fs.existsSync(notePath)) {
        return true;
    } else return false;
}

app.listen(8000, () => {
    console.log("сервер запущено на порті 8000!");
});