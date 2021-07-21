'use strict';

var app = app || {};

(function(app) {
  var api = smt.import('api');
  var view;
  var inProgress = false;

  $(function() {
    try {
      var args = new URLSearchParams(location.search);

      gapi.load('client:auth2', app.initClient);
      view = smt.import('view').create();
      
      // Common
      $(document).on('click', '.fb-close-dialog', app.closeDialog);
      $('#fb-copy-user-button').on('click', true, app.copyUser);
      // Search
      $('#fb-humburger-button').on('click', true, app.setupSearch);
      $(document).on('click', '.fb-search', app.selectSearchText);
      $(document).on('DOMSubtreeModified', '.select-pure__select', app.selectSearchText);
      $('#fb-search-heart').on('click', app.setLoveFilter);
      $('#fb-search-posts-button').on('click', {reset: true}, app.searchPosts);
      $('#fb-show-settings-button').on('click', false, app.showSettings);
      $('#fb-sign-out-button').on('click', false, app.signOut);
      // List
      $('#fb-add-post-button').on('click', false, app.addPost);
      $('#fb-test-button').on('click', false, app.testMasonry);
      $('#fb-read-next-button').on('click', {reset: false}, app.searchPosts);
      $(document).on('click', '.fb-google-title', app.googleSearch);
      $(document).on('click', '.fb-nyaa', app.nyaaSearch);
      $(document).on('click', '.fb-japanhub', app.japanhubSearch);
      $(document).on('click', '.fb-reset', app.reset);
      $(document).on('click', '.fb-back-to-top', app.backToTop);
      $(document).on('click', '.fb-set-opacity', app.setOpacity);
      // Card
      $(document).on('slide.bs.carousel', '.carousel.lazy', app.slideCarousel);
      $(document).on('click', '.fb-edit-post-button', app.editPost);
      $(document).on('click', '.fb-copy-post-button', app.copyPost);
      $(document).on('click', '.fb-view-post-button', app.viewPost);
      // Edit Dialog
      $('#fb-google-title').on('click', app.googleSearch);
      $('#fb-add-url-button').on('click', app.addUrl);
      $('#fb-add-images-button').on('click', app.addImages);
      $('#fb-toggle-all-images-select').on('click', app.toggleAllImagesSelect);
      $('#fb-post-heart').on('click', app.toggleLove);
      $(document).on('click', '.fb-view-url-button', app.viewUrl);
      $(document).on('click', '.fb-copy-url-button', app.copyUrl);
      $(document).on('click', '.fb-paste-url-button', app.pasteUrl);
      $(document).on('click', '.fb-up-url-button', app.upUrl);
      $(document).on('click', '.fb-down-url-button', app.downUrl);
      $(document).on('click', '.fb-delete-url-button', app.deleteUrl);
      $('#fb-add-album-button').on('click', app.addAlbum);
      $('#fb-save-album-button').on('click', app.saveAlbum);
      $('#fb-add-woman-button').on('click', app.addWoman);
      $('#fb-save-woman-button').on('click', app.saveWoman);
      $('#fb-add-author-button').on('click', app.addAuthor);
      $('#fb-save-author-button').on('click', app.saveAuthor);
      $('#fb-add-tag-button').on('click', app.addTag);
      $('#fb-save-tag-button').on('click', app.saveTag);
      $('#fb-save-post-button').on('click', app.savePost);
      $('#fb-delete-post-button').on('click', app.deletePost);
      // Dropbox Dialog
      $('#fb-select-images-button').on('click', app.selectDropboxImages);
      $(document).on('click', '.fb-select-dropbox-folder', app.selectDropboxFolder);
      $(document).on('click', '.fb-select-google-folder', app.selectGoogleFolder);
      // Settings Dialog
      $('#fb-save-settings-button').on('click', app.saveSettings);
      // DOMSubtreeModified
      $('#search-result').on('DOMSubtreeModified', function() {
        console.log('yo');
      });
    } catch(e) {
      api.handleError(e);
    }
  });

  app.copyUser = function() {
    var user = document.getElementById('fb-auth-user');
    user.select();
    document.execCommand('copy');
  };

  app.setupSearch = function() {
    view.setupSearch();
  };

  app.reset = function () {
    view.setupSearch();
    view.reset();
  };

  app.closeDialog = function(event) {
    view.closeDialog(event);
  };

  app.selectSearchText = function(event) {
    view.selectSearchText(event.target);
  };

  app.setLoveFilter = function(event) {
    var love = $('#fb-search-love').val();
    if (love.length == 0) {
      $('#fb-search-love').val('love');
      $('#fb-search-heart').css('color', 'red').removeClass('far').addClass('fas');
    } else {
      $('#fb-search-love').val('');
      $('#fb-search-heart').css('color', 'gray').removeClass('fas').addClass('far');
    }
  };

  app.searchPosts = function(event) {
    if (inProgress) return;
    inProgress = true;
    try {
      if (event.data.reset) {
        view.reset();
      }
      api.showProgress(true);
      var option = view.getSearchOption();
      api.searchPosts(option).then((res) => {
        view.showPosts(res);
      }).catch((error) => {
        api.handleError(error);
      });
    } catch(e) {
      api.handleError(e);
    } finally {
      inProgress = false;
      api.showProgress(false);
    }
  };

  app.slideCarousel = function(event) {
    var lazy = $(event.relatedTarget).find('img[data-src]');
    $(lazy).attr('src', $(lazy).data('src'));
    $(lazy).removeAttr('data-src');
  };

  app.addPost = function(event) {
    try {
      view.editPost({
        fields: {
          urls: []
        }
      });
    } catch(e) {
      api.handleError(e);
    } finally {
    }
  };

  app.editPost = function(event) {
    try {
      var post = view.pickPost(event);
      view.editPost(post);
    } catch(e) {
      api.handleError(e);
    } finally {
    }
  };

  app.copyPost = function(event) {
    if (!confirm('OK ?')) return;
    var post = view.pickPost(event);
    post.id = api.createId();
    console.log(post.fields);
    var res = api.savePost(post);
    view.updatePost(post);
    res.catch((error) => {
      api.handleError(error);
    });
  };

  app.viewPost = function(event) {
    var post = view.pickPost(event);
    window.open(post.fields.videoUrl, '_blank');
  };

  app.savePost = function(event) {
    if (!confirm('OK ?')) return;
    if (inProgress) return;
    inProgress = true;
    try {
      view.validatePost(() => {
        var post = view.getPost(event);
        if (!post.individual) {
          if (!post.id) {
            post.id = api.createId();
          }
          var res = api.savePost(post);
          view.updatePost(post);
          res.catch((error) => {
            api.handleError(error);
          });
        } else {
          post.fields.urls.forEach((u) => {
            var p = {};
            p.id = api.createId();
            p.fields = post.fields;
            p.fields.urls = [u];
            var res = api.savePost(p);
            view.updatePost(p);
            res.catch((error) => {
              api.handleError(error);
            });
          });
        }
      });
    } catch(e) {
      console.log(e);
      api.handleError(e);
    } finally {
      inProgress = false;
    }
  };

  app.deletePost = function(event) {
    if (!confirm('OK ?')) return;
    if (inProgress) return;
    inProgress = true;
    try {
      var post = view.getPost(event);
      api.deletePost(post).then(() => {
        view.deletePost(post);
      }).catch((error) => {
        console.log(error);
        alert(error);
      });
    } catch(e) {
      api.handleError(e);
    } finally {
      inProgress = false;
    }
  };

  app.googleSearch = function(event) {
    var post = view.pickPost(event);
    if (!post) post = view.getPost(event);
    window.open(`https://www.google.co.jp/search?q=${post.fields.title}+${post.fields.women}`, '_blank');
  };

  app.nyaaSearch = function(event) {
    var post = view.pickPost(event);
    var url = `https://sukebei.nyaa.si/?q=${post.fields.title.replace(/ ?[0-9]+歳$/, '')}`;
    if (post.fields.women.length == 1)
      url += `+${post.fields.women}`;
    url += '&f=0&c=0_0';
    window.open(url, '_blank');
  };

  app.japanhubSearch = function(event) {
    var post = view.pickPost(event);
    window.open(`https://www.google.co.jp/search?q=site:japanhub.net ${post.fields.title}`, '_blank');
  };

  app.addUrl = function() {
    view.addUrl();
  };

  app.addImages = function(event) {
    try {
      var target = event.target;
      if ($(target).hasClass('fa-dropbox')) {
        view.readDropbox(event);
      } else if ($(target).hasClass('fa-google-drive')) {
        view.readGoogleDrive(event);
      }
    } catch(e) {
      api.handleError(e);
    } finally {
    }
  };

  app.viewUrl = function() {
    var src = $(event.target.closest('.fb-image-table')).find('img').attr('src');
    window.open(src, '_blank');
  };

  app.copyUrl = function(event) {
    var src = $(event.target.closest('.fb-image-table')).find('img').attr('src');
    console.log(src);
    var pre = document.createElement('pre');
    pre.style.webkitUserSelect = 'auto';
    pre.style.userSelect = 'auto';
    pre.textContent = src;
    document.body.appendChild(pre);
    document.getSelection().selectAllChildren(pre);
    document.execCommand('copy');
    document.body.removeChild(pre);
    smt.clipboard.push(src);
  };

  app.pasteUrl = function(event) {
    if (smt.clipboard.length > 0) {
      var url = smt.clipboard.pop();
      $(event.target.closest('.fb-image-table')).find('img').attr('src', url);
      api.setOpacity();
    }
  };

  app.upUrl = function(event) {
    view.upUrl(event);
  };

  app.downUrl = function(event) {
    view.downUrl(event);
  };
  
  app.deleteUrl = function(event) {
    view.deleteUrl(event);
  };

  app.toggleAllImagesSelect = function(event) {
    view.toggleAllImagesSelect(event);
  };

  app.selectDropboxFolder = function(event) {
    try {
      view.readDropbox(event);
    } catch(e) {
      api.handleError(e);
    }
  };

  app.selectDropboxImages = function(event) {
    view.selectDropboxImages();
  };

  app.selectGoogleFolder = function(event) {
    try {
      view.readGoogleDrive(event);
    } catch(e) {
      api.handleError(e);
    }
  };

  app.toggleLove = function(event) {
    var love = $('#fb-post-love').val();
    if (love.length == 0) {
      $('#fb-post-love').val('love');
      $('#fb-post-heart').css('color', 'red').removeClass('far').addClass('fas');
    } else {
      $('#fb-post-love').val('');
      $('#fb-post-heart').css('color', 'gray').removeClass('fas').addClass('far');
    }
  };

  app.addAlbum = function(event) {
    view.addAlbum(event);
  };

  app.saveAlbum = function(event) {
    if (!confirm('OK ?')) return;
    if (inProgress) return;
    inProgress = true;
    try {
      var album = view.getAlbum(event);
      view.validateAlbum(album, () => {
        api.saveAlbum(album).catch((error) => {
          console.log(error);
          api.handleError(error);
        });
      });
    } catch(e) {
      api.handleError(e);
    } finally {
      inProgress = false;
    }
  };

  app.addWoman = function(event) {
    view.addWoman(event);
  };

  app.saveWoman = function(event) {
    if (!confirm('OK ?')) return;
    if (inProgress) return;
    inProgress = true;
    try {
      var woman = view.getWoman(event);
      view.validateWoman(woman, () => {
        api.saveWoman(woman).catch((error) => {
          api.handleError(error);
        });
      });
    } catch(e) {
      api.handleError(e);
    } finally {
      inProgress = false;
    }
  };

  app.addAuthor = function(event) {
    view.addAuthor(event);
  };

  app.saveAuthor = function(event) {
    if (!confirm('OK ?')) return;
    if (inProgress) return;
    inProgress = true;
    try {
      var author = view.getAuthor(event);
      view.validateAuthor(author, () => {
        api.saveAuthor(author).catch((error) => {
          console.log(error);
          api.handleError(error);
        });
      });
    } catch(e) {
      api.handleError(e);
    } finally {
      inProgress = false;
    }
  };

  app.addTag = function(event) {
    view.addTag(event);
  };

  app.saveTag = function(event) {
    if (!confirm('OK ?')) return;
    if (inProgress) return;
    inProgress = true;
    try {
      var tag = view.getTag(event);
      view.validateTag(tag, () => {
        api.saveTag(tag).catch((error) => {
          console.log(error);
          api.handleError(error);
        });
      });
    } catch(e) {
      api.handleError(e);
    } finally {
      inProgress = false;
    }
  };

  app.showSettings = function(event) {
    view.showSettings();
  };

  app.saveSettings = function(event) {
    var settings = view.getSettings();
    smt.setSettings(settings);
  };

  app.backToTop = function() {
    $('body, html').scrollTop(0);
  };

  app.setOpacity = function() {
    smt.opacity++;
    api.setOpacity();
  };

  app.signOut = function() {
    if (!confirm('OK ?')) return;
    $('#firebaseui-auth-container').removeClass('d-none');
    $('#authenticated-area').addClass('d-none');
    firebase.auth().signOut();
  };

  app.testGoogleDrive = function() {
    try {
      //gapi.auth2.getAuthInstance().signIn();
      gapi.client.drive.files.list({
        'pageSize': 100,
        'fields': "nextPageToken, files(id, name, thumbnailLink, modifiedTime, webContentLink, parents, mimeType)",
        'orderBy': 'name',
        //'q': '"1oKkw3icNxyiv56o2WOKiGwAYBmREwXvO" in parents'
      }).then(function(response) {
        var files = response.result.files;
        if (files && files.length > 0) {
          for (var i = 0; i < files.length; i++) {
            var file = files[i];
            console.log(file);
            document.write(JSON.stringify(file));
          }
        } else {
          console.log('No files found.');
        }
      });
      } catch(e) {
        console.log(e);
      }
  };

    /**
     *  Initializes the API client library and sets up sign-in state
     *  listeners.
     */
  app.initClient = function() {
    gapi.client.init({
      apiKey: 'AIzaSyB7G3nC8SOm2nb-l7hNXIJVtSbMkcGSzq0',
      clientId: '93900782530-58pkdsekc6q6s3to3a63qum520ado967.apps.googleusercontent.com',
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
      scope: 'https://www.googleapis.com/auth/drive.readonly'
    }).then(function () {
      // Listen for sign-in state changes.
      //gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

      // Handle the initial sign-in state.
      //updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      //authorizeButton.onclick = handleAuthClick;
      //signoutButton.onclick = handleSignoutClick;
    }, function(error) {
      appendPre(JSON.stringify(error, null, 2));
    });
  };

  app.testGooglePhotos = function() {
    console.log('test');
    try {
    //var xhr = new XMLHttpRequest();
    //xhr.open('POST',
    //  'https://photoslibrary.googleapis.com/v1/mediaItems:search');
    //xhr.setRequestHeader('Authentication', 'Bearer 4/yQGOSTtAf2sGjOtOH3Ydue_1f5jowYRUWd131vpxeMWUUIkdyp0pYBaEr2kvEPO0fAkfWeYBCC1rVvQKnpsueXo');
    //xhr.send();
    $.ajax('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      type: 'POST',
      dataType: 'json',
      data: [],
      headers: {
        "Authentication": "Bearer 4/yQGOSTtAf2sGjOtOH3Ydue_1f5jowYRUWd131vpxeMWUUIkdyp0pYBaEr2kvEPO0fAkfWeYBCC1rVvQKnpsueXo"
      }
    }).done((data, status, xhr) => {
      console.log(status);
      console.log(data);
      alert("data: " + data);
    }).fail((xhr, status, thrown) => {
      api.handleError(status);
      api.handleError(thrown);
    });
    } catch (e) {
      api.handleError("e: " + e);
    }
  };

  app.testMasonry = function() {
    $(function(){
      $('#search-result').masonry({
          itemSelector: '.fb-card',
          columnWidth: 200,
          percentPosition: true
      });
    });
  };
}(app));
