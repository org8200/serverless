var items = [];

async function consumeAPIGateway(callback, method, path, body) {

    let headers = { 'Authorization': window.localStorage.AccessToken };

    if (ApiGatewayStageUrl) {
        try {
            const response = await fetch(ApiGatewayStageUrl + path, { method, body, headers })
            responseJSON = await response.json();

            if (response.status !== 200) {
                renderErrorMessage(responseJSON);
            } else {
                items = responseJSON;
                callback();
            }
        } catch (err) {
            renderErrorMessage(err);
        }
    } else {
        renderErrorMessage("API Gateway URL has not been configured");
    }
}

// Read all music or by genre
function readMusic(queryParam) {
    path = queryParam ? `/albums?Genre=${queryParam}` : '/albums';
    consumeAPIGateway(renderMusicList, "GET", path);
}

// ***************
// Event Handlers 
// ***************

function onDeleteAlbumClick(element) {
    element.classList.add("loading")

    consumeAPIGateway(() => { location.reload() }, 'DELETE', `/albums`, decorateBodyKeysOnly(items[element.id]));
}

function onEditAlbumClick(itemId) {
    renderMusicModal(true);
    setFormProps(itemId);

    // Write item values to form
    $('.ui.form')
        .form('set values', {
            Artist: items[itemId].Artist,
            Album: items[itemId].Album,
            Genre: items[itemId].Genre,
            Rank: items[itemId].Rank,
            Year: items[itemId].Year
        });

    $('input[name="Artist"]').prop('disabled', true);
    $('input[name="Album"]').prop('disabled', true);

    $('.ui.modal')
        .modal('show');

}

function onAddAlbumClick() {
    renderMusicModal();
    setFormProps();

    $('.ui.modal')
        .modal('show');
}

function onSubmitAddClick() {
    $("#save-button").toggleClass("loading");

    item = $('.ui.form').form('get values')
    item.Rank = parseInt(item.Rank);
    console.log("In Submit Add: ", item)

    consumeAPIGateway(() => { location.reload() }, 'POST', '/albums', decorateBody(item))

    $('.ui.modal')
        .modal('hide');
}

function onSubmitEditClick(itemId) {
    $("#save-button").toggleClass("loading");

    item = $('.ui.form').form('get values');
    item.Rank = parseInt(item.Rank);
    console.log("In Submit Edit: ", item)

    consumeAPIGateway(() => { location.reload() }, 'PUT', `/albums`, decorateBody(item))

    $('.ui.modal')
        .modal('hide');
}

function onSearchClick() {
    renderPlaceHolders();
    readMusic(document.getElementById("search").value);
}

function onSubmitSignIn() {

    user = $('.ui.form.auth').form('get values')
    cognitoUser = createCognitoUser(user.Username);

    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: user.Username,
        Password: user.Password,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function(result) {
            window.localStorage.AccessToken = result.getIdToken().getJwtToken();
            location.reload();
        },

        onFailure: function(err) {
            renderErrorMessage(err.message || JSON.stringify(err));
            $('.ui.modal')
                .modal('hide');
        },
    });

}

function setFormProps(itemId) {
    $('.ui.form')
        .form({
            fields: {
                Album: 'empty',
                Artist: 'empty',
                Genre: 'empty',
                Rank: 'empty'
            },
            onSuccess: function(event) {
                itemId ? onSubmitEditClick(itemId) : onSubmitAddClick()
                event.preventDefault();
            }
        });

}

function decorateBody(item) {
    body = {}
    body.Item = removeFalsy(item)

    return JSON.stringify(body);
}

function decorateBodyKeysOnly(item) {
    body = {}
    body.Artist = item.Artist
    body.Album = item.Album

    return JSON.stringify(body)
}

function removeFalsy(obj) {
    let newObj = {};
    Object.keys(obj).forEach((prop) => {
        if (obj[prop]) { newObj[prop] = obj[prop]; }
    });
    return newObj;
};

function createCognitoUser(username) {
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var userData = {
        Username: username,
        Pool: userPool,
    };

    return new AmazonCognitoIdentity.CognitoUser(userData);
}

function renderErrorMessage(error) {
    error = error.message ? error.message : error;
    errorDOM = `
    <div class="ui negative message">
        <div class="header">
        <i class="exclamation triangle icon"></i> ${error}
        </div>

    </div>`

    document.getElementById("music-container").innerHTML = errorDOM;
}

// Create Music List DOM 
function renderMusicList() {
    var musicListDOM = [];

    if (items.length) {

        for (var i = 0; i < items.length; i++) {
            var listElement = `
        <div class = "card">
            <div class = "ui image">
                 <img src = "assets/images/default.png"> 
            </div>

            <div class = "content">
                <a class = "header">${items[i].Album} </a> 
                <div class = "meta">
                <span class="year">${items[i].Year || "--"} | ${items[i].Genre || "--"} </span>

                </div>
                <span class="year"> ${items[i].Artist}</span>
                <span class = "right floated rating" > ${items[i].Rank || "--"} <i class = "star yellow icon" > </i></span >
     
            </div>

            <div class="extra content">
                <div class="ui two buttons">
                    <div id = ${[i]}
                      class = "ui basic blue floated icon button"
                      onclick = onEditAlbumClick(this.id)>
                      Edit <i class="edit icon"> </i> 
                    </div>
                    <div id=${[i]} class="ui basic red floated icon button"
                      onclick = "onDeleteAlbumClick(this)"> Delete <i class = "trash icon"> </i> 
                    </div>
                </div>
            </div>

        </div>`

            musicListDOM += listElement;
        }
    } else {
        musicListDOM = `<div class="ui container">
        <div class="ui placeholder segment">
        <div class="ui icon header">
          <i class="music icon"></i>
           No albums found.
        </div>
        </div>
      </div>`
    }
    document.getElementById("music-container").innerHTML = `<div class="ui three doubling stackable cards">${musicListDOM}</div>`;
}

// Create Album Modal DOM 
function renderMusicModal(isEdit) {
    modalDOM = `<i class="close icon"></i>
        <div class="header">
        
        <h4 class="ui image header">
            <img src="assets/images/record-logo.png" class="image">
        </h4>
        ${ isEdit? "Edit Album" : "Add Album" } 
        </div>
        <div class="content">
            <form class="ui form">
                <div class="two fields">
                    <div class="field">
                        <label>Artist</label>
                        <input name="Artist" type="text" placeholder="Artist">
                    </div>
                    <div class="field">
                        <label>Album</label>
                        <input name="Album" type="text" placeholder="Album">
                    </div>
                </div>

                <div class="three fields">
                    <div class="field">
                        <label>Genre</label>
                        <input name="Genre" type="text" placeholder="Genre">
                    </div>

                    <div class="field">
                        <label>Rank</label>
                        <input name="Rank" type="number" placeholder="Rank">
                    </div>

                    <div class="field">
                        <label>Year</label>
                        <input name="Year" type="number" placeholder="Year">
                     </div>
                </div>

                <div class="extra content">
                    <div class="ui black reset deny button">
                        Cancel
                    </div>

                    <div id="save-button" class="ui primary right labeled icon submit button">
                        Save
                        <i class="check icon"></i>
                    </div>
                </div>
                <div class="ui error message"></div>
           </div>
        </form>
        </div>`

    document.getElementById("music-modal").innerHTML = modalDOM;
}

function renderPlaceHolders() {
    var placeHolderDom = [];

    for (var i = 0; i < 6; i++) {
        placeHolderElement = `
            <div class="card">
                <div class="image">
                    <div class="ui fluid placeholder">
                        <div class="rectangular image"></div>
                    </div>
                </div>
                <div class="content">
                    <div class="ui placeholder">
                        <div class="header">
                            <div class="very long line"></div>
                        </div>
                        <div class="paragraph">
                            <div class="medium line"></div>
                            <div class="short line"></div>
                        </div>
                    </div>
                </div>

                <div class="extra content">
                    <div class="ui two buttons">
                        <div class="ui disabled basic blue floated icon button">
                            Edit <i class="edit icon"> </i>
                        </div>
                        <div class="ui disabled basic red floated icon button"> Delete <i class="trash icon"> </i>
                        </div>
                    </div>
                </div>
            </div>`
        placeHolderDom += placeHolderElement;
    }

    document.getElementById("music-container").innerHTML = `<div class="ui three doubling stackable cards">${placeHolderDom}</div>`;
}

function renderSignInModal() {
    markup = `<i class="close icon"></i>
    <div class="header">
        <h4 class="ui image header">
            <img src="assets/images/record-logo.png" class="image">
        </h4>
        Log-in to the Music Application
    </div>

    <div class="content">
        <form class="ui form auth">
                <div class="ui stacked segment">
                  <div class="field">
                    <div class="ui left icon input">
                      <i class="user icon"></i>
                      <input type="text" name="Username" placeholder="Username">
                    </div>
                  </div>
                  <div class="field">
                    <div class="ui left icon input">
                      <i class="lock icon"></i>
                      <input type="password" name="Password" placeholder="Password">
                    </div>
                  </div>
                  <div class="ui primary fluid submit button">Sign in</div>
                </div>

                <div class="ui error message"></div>
            </form>
            </div>
        </div>
    </div>`;

    document.getElementById("music-modal").innerHTML = markup;
    $('.ui.modal')
        .modal('show');

    $('.ui.form.auth').form({
        fields: {
            Username: 'empty',
            Password: 'empty'
        },
        onSuccess: function(event) {
            onSubmitSignIn();
            event.preventDefault();
        }
    })
}

function renderMenuButton() {
    let markup = "";

    if (window.localStorage.AccessToken === "") {
        markup = '<a class="ui inverted button" onclick="renderSignInModal()">Sign in</a>';
    } else {
        markup = '<a class="ui inverted button" onclick="onSignOutClick()">Sign out</a>';
    }

    document.getElementById("menu-button").innerHTML = markup;

}

function onSignOutClick() {
    window.localStorage.AccessToken = "";
    location.reload();
}