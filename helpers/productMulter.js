const multer = require('multer');
const path = require('path')


const storage = multer.diskStorage({
    destination:function (req,file,cb) {
       
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' ||file.mimetype === 'image/jpg'){
            cb(null,path.join(__dirname,'../public/images/product'))     

        }else {
            cb(new Error('Invalid file type'), false);
          }
    },
    filename:function (req,file,cb) {
        const name = Date.now()+''+file.originalname;
        cb(null,name)
        
    }
})

const filefilter = (req,file,cb)=>{
    console.log(file,"file from multer")
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' ||file.mimetype === 'image/jpg'){
        cb(null,true)     
    }else{
        cb(null,false)
    }
}

const upload = multer({
    storage:storage,
    fileFilter:filefilter,
    limits: { files:10}
})

module.exports = upload;
