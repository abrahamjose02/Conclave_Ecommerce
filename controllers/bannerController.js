
const Banner = require('../models/bannerModel');

const loadBanner = async(req,res)=>{
    try {
        const banners = await Banner.find();
        res.render('bannerManagement',{banners});
    } catch (error) {
        console.error(error);
    res.status(500).render('404');
    }
}

const loadAddBanner = async(req,res)=>{
    try {
        let message = '';
        res.render('addBanner',{message})
    } catch (error) {
        console.error(error);
    res.status(500).render('404');
    }
}

const addBanner = async(req,res)=>{
    try {
        const{name,description} = req.body; 

        const newBanner = new Banner({
            name:name,
            description:description,
            image:req.file.filename,
            dateCreated: new Date()
        })

        await newBanner.save();

        res.redirect('/admin/bannerList');

    } catch (error) {
        console.error(error);
        res.status(500).render('404');
    }
}

const loadEditBanner = async(req,res)=>{
    try {
        let message = '';

        const bannerId = req.params.bannerId;

        const banner = await Banner.findById(bannerId);

        res.render('editBanner',{message,banner})
    } catch (error) {
        console.error(error);
    res.status(500).render('404');
    }
}


const editBanner = async(req,res)=>{
    try {
        const{name,description} = req.body;

        const bannerId = req.params.bannerId;

        const banner = await Banner.findByIdAndUpdate(bannerId,{
            name:name,
            description:description,
            image:req.file.filename
        });

        res.redirect('/admin/bannerList');

    } catch (error) {
        console.error(error);
    res.status(500).render('404');
    }
}

const enableBanner = async(req,res)=>{
    try {
        const bannerId = req.params.bannerId

        const banner = await Banner.findById(bannerId);

        if(banner){
            banner.isDeleted = false;
            await banner.save();
            res.redirect('/admin/bannerList');
        }else{
            console.error(error);
    res.status(500).render('404');
        }
    } catch (error) {
        console.error(error);
    res.status(500).render('404');
    }
}

const disableBanner = async(req,res)=>{
    try {
        const bannerId = req.params.bannerId

        const banner = await Banner.findById(bannerId);

        if(banner){
            banner.isDeleted = true;
            await banner.save();
            res.redirect('/admin/bannerList');
        }else{
            console.error(error);
    res.status(500).render('404');
        }
    } catch (error) {
        console.error(error);
        res.status(500).render('404');
    }
}

const deleteBanner = async(req,res)=>{
    try {
        const bannerId = req.params.bannerId;

        const banner = await Banner.findByIdAndDelete(bannerId);

        res.redirect('/admin/bannerList');
    } catch (error) {
        console.error(error);
    res.status(500).render('404');
    }
}

module.exports = {
    loadBanner,
    loadAddBanner,
    addBanner,
    loadEditBanner,
    editBanner,
    enableBanner,
    disableBanner,
    deleteBanner
}