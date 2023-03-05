//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");

const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();
mongoose.set('strictQuery', true);

mongoose.connect("mongodb://0.0.0.0:27017/todolistdata", {useNewUrlParser: true , useUnifiedTopology: true})
.then(() => console.log("Connected Successfully.."))
.catch((err) => console.log(err));

const itemsSchema = {
  name: String
}
const Item = mongoose.model("Item", itemsSchema); 
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const item1 = new Item({
  name: "Welcome to the todolist!",
})
const item2 = new Item({
  name: "Hit the + button to aff a new item"

})
const item3 = new Item({
  name: "Hit this <-- button to delete an item"
});
const defaultitems = [item1, item2, item3];

const ListSchema = {
  name: String,
  items: [itemsSchema ]
};
const List = mongoose.model("List", ListSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, founditems)
  {
    if(founditems.length === 0){
      Item.insertMany(defaultitems, function(err)
      {
        if(err)
        {
          console.log(err);
        } else
        {
          console.log("Successfully saved the data");
        }
      });
      res.redirect("/");
    }
    else
    {
      res.render("list", {listTitle: "Today", newListItems: founditems});

    }
  })

}); 
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList)
      {
        const list = new List({
          name: customListName,
          items: defaultitems
        })

        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  })

})
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if(listName === "Today") {
    item.save();
    res.redirect("/");
  }else
  {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
  
});
app.post("/delete", function(req, res)
{
    const checkedItemId =  req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err) {
        console.log("Successfully Deleted checked item");
        res.redirect("/");
      }
    });
  }else
  {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if(!err) {
          res.redirect("/" + listName);
        }
      });
  }
})


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
