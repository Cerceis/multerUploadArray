const express = require("express")
const app = express();
const mongoose = require('mongoose')
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '15mb'}));

//MongoDB related
mongoose.connect( "mongodb://localhost:27017/SandBox",
	{ useUnifiedTopology: true, useNewUrlParser: true  } ,
	(err) =>{
		if(err) console.log(err)
		else console.log('Connected to local DB')
	}
)
const imageSchema = new mongoose.Schema({
	images:[{
		type : Object,
		default : {}
	}]
})
const imageSchema2 = new mongoose.Schema({
	name:{
		type : String,
		required : true
	},
	path:{
		type : String,
		required : true
	},
	size:{
		type : Number,
		required : true 
	}
})
const ImgCollectionOneRecord = mongoose.model('imgCollection', imageSchema)
const ImgCollectionMultipleRecord = mongoose.model('imgCollection2', imageSchema2)

//Multer + upload api
const path = require("path")
const multer  = require('multer')
let uploadImages = multer({storage:multer.diskStorage({
	destination(req,file,cb){
		//Define Save path here
		cb(null,path.join(__dirname,"./uploadedImages/"))
	},
	filename(req,file,cb){
		//Change filename here
		/*
			This creates a random 32 length unique ID for the image if you want to.
			const filename = crypto.randomBytes(16).toString('hex')+"."+file.mimetype.split('/')[1];
		*/
		cb(null, file.originalname)
	}
})})
app.post("/uploadMultipleImages", uploadImages.array("multipleImages"), async(req,res)=>{
	try{
		if(!req.files && req.files.length <= 0) return res.status(500).end()
		//req.files contains the image array data.
		/*
			From here you can just save the entire array into DB, but I only want to save 
			the filename, path and size. So i will use map to reconstruct the array.
		*/
		const reconstructedImageArray = req.files.map(img =>img={name:img.originalname, path:img.path, size:img.size})
		//Now to save the array into DB
		/* METHOD 1
			Given that you already have a record in your collection
			updateOne will always read the first available record, so if you wanna save into specific record
			use "updateOne({_id:yourRecordIdHere}, ...)"
		
		//Code:	Start
		await ImgCollectionOneRecord.updateOne({},{
			$push:{
				images:reconstructedImageArray
			}
		})
		//Code: End
		*/
		/* METHOD 2
			This method creates new record for every images, it's usually better to use this method instead of method 1
		*/
		//Code: Start
		await ImgCollectionMultipleRecord.insertMany(reconstructedImageArray)
		//Code: End
		res.redirect('/')
	}catch(err){
		console.log(err)
		res.status(500).redirect('/')
	}
})


//Index page 
app.use(express.static(__dirname + '/views/'));
app.get('/', (req, res)=>{
	res.render('index.html');
});
app.listen(8000,()=>{
	console.log('Server is up and running on localhost:8000')
});
