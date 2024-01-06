const bcrypt = require('bcrypt');

const hashPassword = async(password)=>{
    try{
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashPassword = await bcrypt.hash(password,salt);
        return hashPassword;

    }catch(error){
        console.log(error.message);
        throw new Error('Error hashing Password');
    }
}

module.exports = hashPassword;