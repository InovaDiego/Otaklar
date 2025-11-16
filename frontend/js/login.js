async function getUsers() {
    let rows = await fetch('http://localhost:3030/api/users');
    let data = rows.json();
    return data;
}

function login(users, email, passwd) {
    let result = false;
    for (let user of users) {
        console.log('Database email: ' + user.email + ". Datbase passwd: " + user.contrasena);
        console.log('Input email: ' + email + ". Input passwd: " + passwd);
        console.log(' ');
        if (user.email === email && user.contrasena === passwd) {
            result = true;
        }
    }
    return result;
}

const form = document.querySelector('.register-card');
const lg_alert = document.getElementById('login-alert');

form.addEventListener('submit', async (e)=> {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const passwd = document.getElementById('password').value;

    if (login(await getUsers(), email, passwd)) {
        lg_alert.classList = 'alert alert-success mt-3';
        lg_alert.textContent = 'Inicio de sesión exitoso. Redirigiendote.'
    } else {
        lg_alert.classList = 'alert alert-danger mt-3';
        lg_alert.textContent = 'Credenciales invalidas.'
    }
});


