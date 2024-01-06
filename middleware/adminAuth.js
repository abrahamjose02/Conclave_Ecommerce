
const isLogin = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            next();
        }
        else{
            res.redirect('/admin');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            res.redirect('/admin/home');
        }
        else{
            next();
        }
    } catch (error) {
        console.log(error.message);
    }
}

const nocache = async(req,res,next)=>{
    res.setHeader('Cache-control','no-store');
    next();
}



module.exports = {
    isLogin,
    isLogout,
    nocache
}