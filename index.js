const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

app.use(express.json());
app.use(cors());

// Database connection with MongoDB
mongoose.connect("mongodb+srv://janenie:admin@cluster0.tekogkd.mongodb.net/E-COMMERCE", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // Set a timeout value in milliseconds
  socketTimeoutMS: 45000,
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// API creation
app.get("/", (req, res) => {
  res.send("Express app is running");
});

// Image storage Engine
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// Creating upload endpoint
app.use('/images', express.static('upload/images'))
app.post("/upload", upload.single('product'), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`
  });
});

// Schema for creating products
const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

app.post('/addproduct', async (req, res) => {
  try {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
      let lastProduct = products[products.length - 1];
      id = lastProduct.id + 1;
    } else {
      id = 1;
    }

    const product = new Product({
      id: id,
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
    });

    console.log(product);
    await product.save();
    console.log("Saved");

    res.json({
      success: true,
      name: req.body.name,
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Creating API for deleting product names
app.post('/removeproduct', async (req, res) => {
  try {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed");
    res.json({
      success: true,
      name: req.body.name
    });
  } catch (error) {
    console.error('Error removing product:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

//creating API for getting all products
app.get('/allproducts',async(req,res)=>{
    let products=await Product.find({});
    console.log("All products fetched");
    res.send(products);
})

//schema for user model

const Users= mongoose.model('Users',{
  name:{
    type:String,
  },
  email:{
    type:String,
    unique:true,
  },
  password:{
    type:String,
  },
  cartData:{
    type:Object,
  },
  date:{
    type:Date,
    default:Date.now
  }
})

//creating endpoint for registering the user

app.post('/signup',async(req,res)=>{

let check=await Users.findOne({email:req.body.email});
if(check){
  return res.status(400).json({success:false,errors:"existing user found with the same email address"})
}
let cart={};
for(let i=0;i<300;i++){
  cart[i]=0;
}
const user=new Users({
  name:req.body.username,
  email:req.body.email,
  password:req.body.password,
  cartData:cart,
})

await user.save();

const data={
  user:{
    id:user.id
  }
}

const token=jwt.sign(data,'secret_ecom');//to make the token unreadable
res.json({success:true,token})

})

//creating endpoint for  user login 
app.post('/login',async(req,res)=>{
    let user=await Users.findOne({email:require.body.email});
    if(user){
        const passCompare= req.body.password===user.password;
        if(passCompare){
            const data={
                user:{
                    id:user.id
                }
            }
            const token=jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else{
            res.json({success:false,errors:"Wrong Password"});
        }
    }
    else{
        res.json({success:false,errors:"Wrong Email id"})
    }

})

app.listen(port, (error) => {
  if (!error) {
    console.log("Server running on port " + port);
  } else {
    console.log("Error: " + error);
  }
});
