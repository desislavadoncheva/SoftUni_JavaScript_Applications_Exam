const userModel = firebase.auth();
const db = firebase.firestore();


const app = Sammy('#root', function () {
    this.use('Handlebars', 'hbs');

    this.get('#/home', function (context) {
        db.collection('exam').get()
            .then((response) => {
                context.exam = response.docs.map((offer) => { return { id: offer.id, ...offer.data() } });
                extendContext(context).then(function () {
                    this.partial('./templates/home.hbs');
                });
            })
            .catch((error) => {
                console.log(error);
            });
    });

    this.get('#/success', function (context) {
        extendContext(context).then(function () {
            this.partial('./templates/success.hbs');
        });
    });

    this.get('#/error', function (context) {
        extendContext(context).then(function () {
            this.partial('./templates/error.hbs');
        });
    });

    this.get('#/login', function (context) {
        extendContext(context).then(function () {
            this.partial('./templates/login.hbs');
        });
    });

    this.post('#/login', function (context) {
        const { email, password } = context.params;
        userModel.signInWithEmailAndPassword(email, password)
            .then((userData) => {
                saveUserData(userData);
                this.redirect('#/success');
                Handlebars.registerHelper('message', function () {
                    return "Login successful."
                });
                setTimeout(function () {
                    window.location.href = '#/home';
                }, 300);
            })
            .catch((error) => {
                this.redirect('#/error');
                Handlebars.registerHelper('errorMessage', function () {
                    return error.message
                });
                setTimeout(function () {
                    window.location.href = '#/login';
                }, 300);
            });
    });

    this.get('#/register', function (context) {
        extendContext(context).then(function () {
            this.partial('./templates/register.hbs');
        });
    });

    this.post('#/register', function (context) {
        const { email, password, repeatPassword } = context.params;
        if (password !== repeatPassword) {
            this.redirect('#/error');
            Handlebars.registerHelper('errorMessage', function () {
                return "The repeat password should be equal to the password";
            });
            setTimeout(function () {
                window.location.href = '#/register';
            }, 300);
            return;
        };
        userModel.createUserWithEmailAndPassword(email, password)
            .then((userData) => {
                this.redirect('#/success');
                Handlebars.registerHelper('message', function () {
                    return "Successful registration!"
                });
                setTimeout(function () {
                    window.location.href = '#/home';
                }, 300);
            })
            .catch((error) => {
                this.redirect('#/error');
                Handlebars.registerHelper('errorMessage', function () {
                    return error.message
                });
                setTimeout(function () {
                    window.location.href = '#/register';
                }, 300);
            });
    });

    this.get('#/logout', function (context) {
        userModel.signOut()
            .then(() => {
                clearUserData(); this.redirect('#/success');
                Handlebars.registerHelper('message', function () {
                    return "Successful logout"
                });
                setTimeout(function () {
                    window.location.href = '#/home';
                }, 300);
            })
            .catch((error) => {
                console.log(error);
            });
    });

    this.get('#/create', function (context) {
        extendContext(context).then(function () {
            this.partial('./templates/create.hbs');
        });
    });

    this.post('#/create', function (context) {
        const { product, description, price, pictureUrl } = context.params;
        if (product.length == 0 || description.length == 0 || price.length == 0) {
            this.redirect('#/error');
            Handlebars.registerHelper('errorMessage', function () {
                return "Invalid inputs";
            });
            setTimeout(function () {
                window.location.href = '#/create';
            }, 300);
            return;
        };

        if (pictureUrl
            .match(/https:\/\//g) == null) {
            this.redirect('#/error');
            Handlebars.registerHelper('errorMessage', function () {
                return "Invalid inputs";
            });
            setTimeout(function () {
                window.location.href = '#/create';
            }, 300);
            return;
        };
        db.collection('exam').add({
            product,
            description,
            price,
            pictureUrl,
            creator: getUserData().email
        }).then((createdoffer) => {
            this.redirect('#/success');
            Handlebars.registerHelper('message', function () {
                return "Created successfully!"
            });
            setTimeout(function () {
                window.location.href = '#/dashboard';
            }, 300);
        })
            .catch((error) => {
                console.log(error);
            });
    });

    this.get('#/dashboard', function (context) {
        db.collection('exam').get()
            .then((response) => {
                context.exam = response.docs.map((offer) => { return { id: offer.id, ...offer.data() } });
                context.exam.forEach(function (offer) {
                    var offerIndex = context.exam.indexOf(offer);
                    const offerId = offer.id;
                    db.collection('exam').doc(offerId).get()
                        .then((response) => {
                            const isTheCreator = response.data().creator === getUserData().email;
                            offer = { ...response.data(), offerIndex, isTheCreator, id: offerId };
                            db.collection('exam').doc(offerId).set(offer);
                        });
                });
                extendContext(context).then(function () {
                    this.partial('./templates/dashboard.hbs');
                });
            })
            .catch((error) => {
                console.log(error);
            });
    });

    this.get('#/edit/:offerId', function (context) {
        const { offerId } = context.params;
        db.collection('exam').doc(offerId).get()
            .then((response) => {
                context.offer = { id: offerId, ...response.data() };
                extendContext(context).then(function () {
                    this.partial('./templates/edit.hbs');
                });
            })
            .catch((error) => {
                console.log(error);
            });
    });

    this.post('#/edit/:offerId', function (context) {
        const { offerId, product, description, price, pictureUrl } = context.params;
        db.collection('exam').doc(offerId).get()
            .then((response) => {
                return db.collection('exam').doc(offerId).set({
                    ...response.data(),
                    product,
                    description,
                    price,
                    pictureUrl
                });
            })
            .then((response) => {
                this.redirect('#/success');
                Handlebars.registerHelper('message', function () {
                    return "Eddited successfully"
                });
                setTimeout(function () {
                    window.location.href = `#/dashboard`;
                }, 300);
            })
            .catch((error) => {
                console.log(error);
            });
    });

    this.get('#/details/:offerId', function (context) {
        const { offerId } = context.params;
        db.collection('exam').doc(offerId).get()
            .then((response) => {
                context.offer = { id: offerId, ...response.data() };
                extendContext(context).then(function () {
                    this.partial('./templates/details.hbs');
                });
            })
            .catch((error) => {
                console.log(error);
            });
    });

    this.get('#/delete/:offerId', function (context) {
        const { offerId } = context.params;
        db.collection('exam').doc(offerId).get()
            .then((response) => {
                context.offer = { id: offerId, ...response.data() };
                extendContext(context).then(function () {
                    this.partial('./templates/delete.hbs');
                });
            })
            .catch((error) => {
                console.log(error);
            });
    });

    this.post('#/delete/:offerId', function (context) {
        const { offerId } = context.params;
        db.collection('exam').doc(offerId).delete()
            .then(() => {
                this.redirect('#/success');
                Handlebars.registerHelper('message', function () {
                    return "Deleted successfully!"
                });
                setTimeout(function () {
                    window.location.href = '#/dashboard';
                }, 500);
            })
            .catch((error) => {
                console.log(error);
            });
    });

});


(() => {
    app.run('#/home');
})();

function extendContext(context) {
    const user = getUserData();
    context.isLoggedIn = Boolean(user);
    context.email = user ? user.email : '';
    return context.loadPartials({
        'header': './partials/header.hbs',
        'footer': './partials/footer.hbs'
    });
};

function saveUserData(data) {
    const { user: { email, uid } } = data;
    localStorage.setItem('user', JSON.stringify({ email, uid }));
};

function getUserData() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

function clearUserData() {
    localStorage.removeItem('user');
};