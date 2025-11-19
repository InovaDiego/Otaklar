//definitions
async function checkEmail(email) {
    const res = await fetch("http://localhost:3030/api/users");
    const data = await res.json();
    let result = false;
    for (let user of data) {
        if (user.email === email) {
            result = true;
        }
    }
    console.log(result);
    return result;
}

function validPassword(pwd) {
    const lengthOK = pwd.length >= 8 && pwd.length <= 20;

    //checks if it has at least one upper and lower case and a digit 
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasDigit = /\d/.test(pwd);


    const specials = pwd.match(/[!@#$%&*\-_+]/g) || [];
    const specialOK = specials.length >= 1 && specials.length <= 3;

    return lengthOK && hasUpper && hasLower && hasDigit && specialOK;
}

//main code
const name_field = document.getElementById('name');
const email = document.getElementById('email');
const pwd = document.getElementById('password');
name_field.setCustomValidity("Campo vacio.");
email.setCustomValidity("Campo vacio.");
pwd.setCustomValidity("Campo vacio.");

name_field.addEventListener('input', () => {
    let name_val = name_field.value;
    const emptyName = /^\s*$/.test(name_val);

    if (emptyName) {
        name_field.setCustomValidity("Campo vacío.");
        name_field.reportValidity();
        return;
    } else {
        name_field.setCustomValidity("");
    }

    name_val = name_val.trim();    

    if (!(/^[a-zA-Z]{2,}( [A-Za-z]{2,})*?$/.test(name_val))) {
        name_field.setCustomValidity("El nombre tiene otro caracter que no es letra, tiene menos de dos caracteres o tiene doble espacios.")
        name_field.reportValidity();
    } else {
        name_field.setCustomValidity("");
    }
});

email.addEventListener('input', async () => {
    let mail_val = email.value;
    let check_space = mail_val;
    mail_val = mail_val.trim();
    const emptyName = /^\s*$/.test(check_space);

    if (emptyName) {
        email.setCustomValidity("Campo vacío.");
        email.reportValidity();
    } else if (!(/^[a-zA-Z0-9._]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(mail_val))) {
        email.setCustomValidity("Email invalido.")
        email.reportValidity();
    } else if (await checkEmail(mail_val)) { 
        email.setCustomValidity("El correo ya existe.");
        email.reportValidity();
    } else {
        email.setCustomValidity("");
    }
});

pwd.addEventListener('input', () => {
    const pwd_val = pwd.value;
    const emptyName = /^\s*$/.test(pwd_val);

    if (emptyName) {
        pwd.setCustomValidity("Campo vacío.");
        pwd.reportValidity();
        return;
    } else {
        pwd.setCustomValidity("");
    }

    if (!validPassword(pwd_val)) {
        pwd.setCustomValidity("La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un dígito, al menos un carácter especial y tener una longitud de entre 8 y 20 caracteres.")
        pwd.reportValidity();
    } else {
        pwd.setCustomValidity("");
    }
});
