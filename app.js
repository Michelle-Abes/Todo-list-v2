import express from "express";
import {dirname} from "path";
import {fileURLToPath} from "url";
import * as date from "./date.js";
import mongoose from "mongoose";
import _ from "lodash";


const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');

app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

// Establish connection
mongoose.connect('mongodb+srv://admin-michelle:Test123@cluster0.ttobx.mongodb.net/todoListDB', {useNewUrlParser: true, useUnifiedTopology: true});

// Create Schema
const itemsSchema = new mongoose.Schema({
  name: String
});

// Create mongoose model
const Item = mongoose.model("Item", itemsSchema);

// Create documents

const item1 = new Item({
  name: "Welcome to your todoList!"
});

const item2= new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

// create an array of documents
const defaultItems = [item1, item2, item3];

// create List schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

// create mongoose model for list schema
const List = mongoose.model("List", listSchema);

app.get("/", (req,res) =>{

    const day = date.getDate();

    Item.find({}, (err,foundItems)=>{

      if (foundItems.length === 0){
      
        // Insert the array of documents to a DB
        Item.insertMany(defaultItems, (err)=>{
  
          if (err){
            console.log(err);
          } else{
            console.log("Inserted the default Items to DB.");
          }
          
          res.redirect("/");
        });
    }   
    else {
        res.render("list", {ListTitle: day, newListItems: foundItems});
      }
  });

});

app.get("/:customListName", (req,res) =>{
   const customListName = _.capitalize(req.params.customListName);

   List.findOne({name:customListName}, (err, foundList)=>{
     if(!err){
        if (!foundList){
          // console.log("Doesn't exist! ");
          // create a new list
          // create list documents
          const list = new List({
            name: customListName,
            items: defaultItems
          });

          list.save();
          res.redirect("/" + customListName);
        }else{
          // console.log("Exists! ");
          // show an existing list
          res.render("list", {ListTitle: foundList.name, newListItems: foundList.items});
        }
     }
   });
});

app.get("/about", (req,res) =>{
    res.render("about");
});

app.post("/", (req,res) => {
    
    const itemName = req.body.newItem;
    const listName = req.body.submit;
    const day = date.getDate();

    const newItem = new Item({name: itemName});

    if (day.startsWith(listName)){
      newItem.save();
      res.redirect("/");
    } else {
      List.findOne({name: listName}, (err, foundList)=>{
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      });
    }

});

app.post("/delete", (req,res) => {

  const itemIDToDelete = req.body.checkbox;
  const hiddenListName = req.body.hiddenListName;
  const day = date.getDate();

  console.log(hiddenListName);
  console.log(day);
  console.log(itemIDToDelete);
  if (day.startsWith(hiddenListName[0])){ 
    Item.findByIdAndRemove(itemIDToDelete, (err) =>{
      if(!err){
        console.log("Successfully deleted checked item from DB");
        res.redirect("/");
      } 
  });
 } 
 else {  
    List.findOneAndUpdate({name: hiddenListName[0]}, {$pull: {items: {_id: itemIDToDelete}}}, (err)=>{
      if(!err){
        res.redirect("/" + hiddenListName[0]);
        } 
      });   
    }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => console.log("Server has started succesfully."));

