//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/todoListDB", {useNewUrlParser:true});

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemsSchema = mongoose.Schema({
  name:String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name:"Go to the gym"
});

const item2 = new Item({
  name:"Buy stuff"
});

const item3 = new Item({
  name:"Get some coffee"
});

const defaultItems = [item1, item2 , item3];

const listSchema = mongoose.Schema({
  name:String,
  items:[itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
//const day = date.getDate();
List.find().distinct('name',function(err, listTitles) {
  if (!err) {
    Item.find({},function(err,foundItems) {
      if(foundItems.length === 0){
        Item.insertMany(defaultItems, function (err) { 
          if(err){
            console.log(err);
          }else{
            console.log("Sucessfully inserted");
          }
       });
       res.redirect("/");
      }else{
        res.render("list", {listTitle: "Today", newListItems: foundItems, listTitles:listTitles});
      }
    });
  }
})
  
});

app.post("/", function(req, res){

  const listName = req.body.list;
  const itemName = req.body.newItem;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name:listName}, function(err, listItem){
      listItem.items.push(item);
      listItem.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId,function(err) {
      if (err) {
        console.log(err);
      }else{
        console.log("successfully removed "+checkedItemId);
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}}, function(err) {
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
  
});

app.get("/:customListTitle",function(req,res) {
  const customListTitle = _.capitalize(req.params.customListTitle);

  List.find().distinct('name',function(err, listTitles) {
    if (!err) {
      List.findOne({name:customListTitle},function(err, foundList1) {
        if(!err){
          if (!foundList1) {
            const list = new List({
              name:customListTitle,
              items:defaultItems
            });
            list.save();
            res.redirect("/" + customListTitle);
          }else{
            List.findOne({name:customListTitle}, function(err, foundList2){
              
              res.render("list", {listTitle: customListTitle, newListItems: foundList2.items, listTitles:listTitles});
            });
          }
        }
      });
    }
  })
});

app.post("/addList", function(req, res) {
  const newListName = req.body.newList;
  res.redirect("/"+newListName);
})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
