'use strict';

smt.export('view', function(smt, undefined) {
  var api = smt.import('api');
  var dropbox = smt.import('dropbox');
  var google = smt.import('google-drive');
  var types = smt.import('types').create();
  var albums = smt.import('albums').create();
  var women = smt.import('women').create();
  var authors = smt.import('authors').create();
  var tags = smt.import('tags').create();

  function createCard(cardPost, template, callback) {
    var card = $.parseHTML(template);
    $(card).removeClass('d-none');
    $(card).attr('id', cardPost.id);
    var carouselId = `fb-post-carousel-${cardPost.id}`;
    $(card).find('.fb-post-carousel').attr('id', carouselId);
    $(card).find('.fb-post-carousel-control').attr('href', `#${carouselId}`);
    var carouselItems = $(card).find('.fb-post-carousel-items');
    var carouselItemTemplate = $(card).find('.fb-post-carousel-item').prop('outerHTML');
    carouselItems.empty();
    carouselItems.append(cardPost.fields.urls.map((u, i, a) => {
      var carouselItem = $.parseHTML(carouselItemTemplate);
      var img = $(carouselItem).find('.fb-post-image');
      //$('img.lazy').lazyload({
      //  effect: 'fadeIn',
      //  effectspeed: 1000
      //});
      $(carouselItem).find('.fb-post-url').text(u);
      if (i === 0) {
        $(carouselItem).addClass('active');
      //var preFetch = 2;
      //if (i <= preFetch || i >= a.length - preFetch) {
        img.attr('src', u);
      } else {
        img.attr('src', 'holder.js/300x200');
        img.attr('data-src', u);
      }
      return $(carouselItem).prop('outerHTML');
    }).join(''));
    $(card).find('.fb-post-title').text(cardPost.fields.title);
    if (cardPost.fields.love) {
      $(card).find('.fb-post-love').removeClass('far').addClass('fas').css('color', 'red');
    } else {
      $(card).find('.fb-post-love').removeClass('fas').addClass('far').css('color', 'white');
    }
    $(card).find('.fb-post-type').text(cardPost.fields.type);
    if (cardPost.fields.videoUrl) {
      $(card).find('.fb-view-post-button').attr('data-href', cardPost.fields.videoUrl);
      $(card).find('.fb-view-post-button').removeClass('d-none');
    } else {
      $(card).find('.fb-view-post-button').addClass('d-none');
    }
    createBadge(card, cardPost.fields.women, '.fb-post-women', '.fb-post-woman');
    createBadge(card, cardPost.fields.authors, '.fb-post-authors', '.fb-post-author');
    createBadge(card, cardPost.fields.tags, '.fb-post-tags', '.fb-post-tag');
    createBadge(card, cardPost.fields.albums, '.fb-post-albums', '.fb-post-album');
    $(card).find('.fb-post-url-count').text(cardPost.fields.urls.length);
    if (cardPost.fields.createdAt) {
      try {
        $(card).find('.fb-post-created-at').text(cardPost.fields.createdAt.toLocaleString('ja-JP').replace(/\//g, '-'));
      } catch {}
    }
    $(card).find('.fb-post-id').text(cardPost.id);
    callback(card);
  }

  function createBadge(card, items, areaClass, badgeClass) {
    if (items) {
      var area = $(card).find(areaClass);
      var template = $(card).find(badgeClass).prop('outerHTML');
      items.forEach((e) => {
        var badge = $.parseHTML(template);
        $(badge).text(e);
        if (e === 'Video Memorable')
          $(badge).css('background-color', 'rgb(216, 191, 216, 1)');
        $(area).append(badge);
      });
    }
  }

  function createSelectPure(container, options, values) {
    $(container).text('');
    return new SelectPure(container, {
      options: options,
      multiple: true,
      icon: 'fa fa-times',
      value: api.intersect(values, options.map((e) => e.label))
    });
  }

  return {
    create: function() {
      var $searchLimit = $('#fb-search-limit');
      var $searchType = $('#fb-search-type');
      var $searchAlbum = $('#fb-search-album');
      var $resultArea = $('#search-result');
      var $infoMessageArea = $('#info-msg-area');
      var $cardTemplate = $('#fb-card-template').prop('outerHTML');
      var $readNextButton = $('#fb-read-next-button');
      var $editDialog = $('#editDialog');
      var $editForm = $('#editForm');
      var $dropboxDialog = $('#fb-dropbox-dialog');
      var $settingsDialog = $('#fb-settings-dialog');
      var $dropboxCode = $('#fb-dropbox-code');
      var $dropboxImages = $('#fb-dropbox-images');
      var dropboxImageTemplate = $dropboxImages.html();
      var $postUrls = $editDialog.find('#fb-post-urls');
      var urlTemplate = $postUrls.html();
      var typeHolder = $editDialog.find('.fb-post-types');
      var typeTemplate = typeHolder.html();
      var lastVisible;
      var bricklayer;

      return {
        reset: function() {
          $resultArea.parent().scrollTop(0);
          $resultArea.empty();
          $infoMessageArea.empty();
          $readNextButton.addClass('d-none');
          lastVisible = undefined;
        },

        setupSearch: function() {
          $searchType.empty();
          $searchType.append($('<option>').append('(Type)'));
          types.getAll().forEach((t) => {
            $($('<option>', {value: t}).append(t)).appendTo($searchType);
          });
          $searchAlbum.empty();
          $searchAlbum.append($('<option>').append('(Album)'));
          albums.getAll().forEach((a) => {
            $($('<option>', {value: a}).append(a)).appendTo($searchAlbum);
          });
          $womenSelectSearch = createSelectPure('#fb-post-women-search', women.getAllSelectPure());
          $authorsSelectSearch = createSelectPure('#fb-post-authors-search', authors.getAllSelectPure());
          $tagsSelectSearch = createSelectPure('#fb-post-tags-search', tags.getAllSelectPure());
          $('input[name="fb-search"]').prop('checked', false);
        },

        closeDialog: function(event) {
          var dialog = $(event.target.closest('.modal'));
          $(dialog).modal('hide');
          //api.initForm($(dialog));
        },

        getSearchOption: function() {
          return {
            filter: $('input[name="fb-search"]:checked').val(),
            love: $('#fb-search-love').val(),
            text: $('input[name="fb-search"]:checked').closest('div').find('.fb-search').val(),
            women: $womenSelectSearch.value(),
            authors: $authorsSelectSearch.value(),
            tags: $tagsSelectSearch.value(),
            orderBy: $('input[name="fb-search-order-by"]:checked').val(),
            limit: parseInt($searchLimit.val()),
            lastVisible: lastVisible
          };
        },

        selectSearchText: function(target) {
          var div = $(target.closest('.form-check-inline'));
          div.find('input[name="fb-search"]').prop('checked', true);
        },

        showPosts: function(result) {
          if (!bricklayer)
            bricklayer = new Bricklayer(document.querySelector('.bricklayer'));
          if (result.docs.length === 0) {
            $infoMessageArea.append('No more posts.');
            $readNextButton.addClass('d-none');
          } else {
            lastVisible = result.docs[result.docs.length - 1];
            var divider = $('<div>');
            //$resultArea.append(divider);
            bricklayer.append(divider.get(0));
            result.docs.forEach((ref) => {
              var fields = ref.data();
              try {
                fields.createdAt = fields.createdAt.toDate();
              } catch {}
              createCard({id: ref.id, fields: fields}, $cardTemplate, function(card) {
                //$resultArea.append(card);
                bricklayer.append(card);
                api.setOpacity();
              });
            });
            $('html,body').animate({ scrollTop: divider.offset().top });
            $readNextButton.removeClass('d-none');
          }
        },

        pickPost: function(event) {
          var card = $(event.target.closest('.card'));
          return {
            id: card.attr('id'),
            fields: {
              urls: card.find('.fb-post-url').get().map((i) => $(i).text()),
              title: card.find('.fb-post-title').text(),
              type: card.find('.fb-post-type').text(),
              //videoUrl: card.find('.fb-view-post-button').attr('data-href'),
              love: card.find('.fb-post-love').css('color') == 'rgb(255, 0, 0)',
              women: card.find('.fb-post-woman').get().map((w) => $(w).text()),
              authors: card.find('.fb-post-author').get().map((a) => $(a).text()),
              tags: card.find('.fb-post-tag').get().map((t) => $(t).text()),
              albums: card.find('.fb-post-album').get().map((a) => $(a).text()),
              createdAt: card.find('.fb-post-created-at').text()
            }
          };
        },

        editPost: function(card) {
          api.initForm($editDialog);
          $editForm.removeClass('was-validated');
          $('#fb-post-heart').css('color', 'gray').removeClass('fas').addClass('far');
          if (card.id) {
            $('#editModalTitle').text('Edit');
          } else {
            $('#editModalTitle').text('Add');
          }
          // Id
          $editDialog.find('#fb-post-id').val(card.id);
          // Created at
          $editDialog.find('#fb-post-created-at').val(card.fields.createdAt);
          // Images
          $postUrls.empty();
          card.fields.urls.forEach((u) => {
            var postUrl = $.parseHTML(urlTemplate);
            $(postUrl).find('.fb-post-url').attr('src', u);
            $postUrls.append(postUrl);
          });
          // Title
          $editDialog.find('#fb-post-title').val(card.fields.title);
          // Type
          typeHolder.empty();
          types.getAll().forEach((t) => {
            var typeItem = $.parseHTML(typeTemplate);
            var radio = $(typeItem).find('input[name="fb-post-type"]');
            radio.attr('value', t);
            if (t === card.fields.type)
              radio.prop('checked', true);
            $(typeItem).find('.fb-post-type').text(t);
            typeHolder.append(typeItem);
          });
          // Love
          if (card.fields.love) {
            $editDialog.find('#fb-post-love').val('love');
            $editDialog.find('#fb-post-heart').removeClass('far').addClass('fas').css('color', 'red');
          } else {
            $editDialog.find('#fb-post-love').val('');
            $editDialog.find('#fb-post-heart').removeClass('fas').addClass('far').css('color', 'gray');
          }
          // Google
          //$('#fb-google-title').prop('href', `https://www.google.co.jp/search?q=${card.fields.title}+${card.fields.type}+adult`);
          // Badges
          $albumsSelect = createSelectPure('#fb-post-albums', albums.getAllSelectPure(), card.fields.albums);
          $womenSelect = createSelectPure('#fb-post-women', women.getAllSelectPure(), card.fields.women);
          $authorsSelect = createSelectPure('#fb-post-authors', authors.getAllSelectPure(), card.fields.authors);
          $tagsSelect = createSelectPure('#fb-post-tags', tags.getAllSelectPure(), card.fields.tags);
          $editDialog.modal('show');
          api.setOpacity();
          // Delete button
          if (!card.id) {
            $('#fb-delete-post-button').addClass('d-none');
            $('#fb-post-individual-area').removeClass('d-none');
          } else {
            $('#fb-delete-post-button').removeClass('d-none');
            $('#fb-post-individual-area').addClass('d-none');
          }
        },

        getPost: function(event) {
          var dialog = $(event.target.closest('.modal'));
          var post = {
            id: dialog.find('#fb-post-id').val(),
            individual: $('#fb-post-individual:checked').val(),
            fields: {
              urls: dialog.find('.fb-post-url').get().map((u) => $(u).attr('src')).filter((u) => u.length > 0),
              title: $('#fb-post-title').val(),
              type: dialog.find('input[name="fb-post-type"]:checked').val(),
              videoUrl: dialog.find('#fb-post-video-url').val(),
              love: $('#fb-post-love').val() == 'love',
              women: $womenSelect.value(),
              authors: $authorsSelect.value(),
              tags: $tagsSelect.value(),
              albums: $albumsSelect.value()
            }
          };
          var createdAt = $('#fb-post-created-at').val();
          var now = new Date();
          if (createdAt.length > 0) {
              post.fields.createdAt = new Date(Date.parse(createdAt.replace(/-/g, '/').replace(/T/, ' ').replace(/Z/, '')));
          } else {
              post.fields.createdAt = now;
          }
          post.fields.updatedAt = now;
          return post;
        },

        validatePost: function(callback) {
          if ($editForm.get(0).checkValidity() === true) {
            if (callback) {
              callback();
            }
          } else {
            $editForm.addClass('was-validated');
          }
        },

        updatePost: function(post) {
          if (!bricklayer)
            bricklayer = new Bricklayer(document.querySelector('.bricklayer'));
          try {
            post.fields.createdAt = post.fields.createdAt.toDate();
          } catch {}
          createCard(post, $cardTemplate, function(card) {
            var current = $(`#${post.id}`);
            if (current.length) {
              current.replaceWith(card);
              api.setOpacity();
            }
            else {
              //$resultArea.prepend(card);
              bricklayer.prepend(card);
              api.setOpacity();
            }
          });
          $editDialog.modal('hide');
        },

        deletePost: function(data) {
          $(`#${data.id}`).fadeOut('normal', function() {
            $(`#${data.id}`).remove();
          });
          $editDialog.modal('hide');
        },

        upUrl: function(event) {
          var src = event.target.closest('.fb-image-table');
          var srcImg = $(src).find('img');
          var srcUrl = srcImg.attr('src');
          var dst = src.previousSibling.previousSibling;
          if (dst) {
            dst = dst.previousSibling;
            var dstImg = $(dst).find('img');
            var dstUrl = dstImg.attr('src');
            dstImg.attr('src', srcUrl);
            srcImg.attr('src', dstUrl);
          }
        },

        downUrl: function(event) {
          var src = event.target.closest('.fb-image-table');
          var srcImg = $(src).find('img');
          var srcUrl = srcImg.attr('src');
          var dst = src.nextSibling.nextSibling;
          if (dst) {
            dst = dst.nextSibling;
            var dstImg = $(dst).find('img');
            var dstUrl = dstImg.attr('src');
            dstImg.attr('src', srcUrl);
            srcImg.attr('src', dstUrl);
          }
        },

        deleteUrl: function(event) {
          var src = event.target.closest('.fb-image-table');
          $(src).remove();
        },

        toggleAllImagesSelect: function(event) {
          $('input[name="fb-dropbox-image"]').prop('checked', event.target.checked);
        },

        addUrl: function() {
          var postUrl = $.parseHTML(urlTemplate);
          $postUrls.append(postUrl);
        },

        selectDropboxImages: function() {
          $dropboxDialog.find('input[name="fb-dropbox-image"]:checked').get().forEach((e, i, a) => {
            var postUrl = $.parseHTML(urlTemplate);
            var url = $(e).closest('.card').find('img').attr('src');
            $(postUrl).find('.fb-post-url').attr('src', url);
            if (i === 0) {
              if ($('#fb-post-title').val().length === 0) {
                if (a.length === 1) {
                  $('#fb-post-title').val($(e).closest('.card').find('.fb-dropbox-image').text());
                } else {
                  $('#fb-post-title').val($('#fb-dropbox-title').val());
                }
              }
              var createdAt = $(e).closest('.card').find('img').attr('alt');
              $('#fb-post-created-at').val(createdAt);
              console.log(createdAt);
            }
            $postUrls.append(postUrl);
            api.setOpacity();
          });
          $dropboxDialog.modal('hide');
        },

        readDropbox: function(event) {
          api.initForm($dropboxDialog);
          var folder = $(event.target).val();
          $('#fb-dropbox-title').val($(event.target).text());
          $dropboxImages.empty();
          dropbox.listFolder(folder).done((res) => {
            res.entries.sort(function(a, b) {
              if (a.name < b.name) return -1;
              else return 1;
            }).forEach((item) => {
              if (item['.tag'] === 'file' && item.name.split('.').pop().match(/jpe?g|png|gif|bmp/i)) {
                var dropboxItem = $.parseHTML(dropboxImageTemplate);
                $dropboxImages.append(dropboxItem);
                dropbox.listShare(item.id).done((res) => {
                  if (res.links.length === 0) {
                    dropbox.createShare(item.id).done((res) => {
                      var directUrl = dropbox.directUrl(res.url);
                      $(dropboxItem).find('input[name="fb-dropbox-image"]').attr('value', directUrl);
                      $(dropboxItem).find('.fb-dropbox-image').text(item.name.replace(/\.[^/.]+$/, ''));
                      $(dropboxItem).find('img').attr('src', directUrl);
                      $(dropboxItem).find('img').attr('alt', item.client_modified);
                      //createDropboxImage($dropboxImages, dropboxImageTemplate, item.name, res.url);
                    }).fail((error) => {
                      console.log(error);
                    });
                  } else {
                    var directUrl = dropbox.directUrl(res.links[0].url);
                    $(dropboxItem).find('input[name="fb-dropbox-image"]').attr('value', directUrl);
                    $(dropboxItem).find('.fb-dropbox-image').text(item.name.replace(/\.[^/.]+$/, ''));
                    $(dropboxItem).find('img').attr('src', directUrl);
                    $(dropboxItem).find('img').attr('alt', item.client_modified);
                    //createDropboxImage($dropboxImages, dropboxImageTemplate, item.name, res.links[0].url);
                  }
                }).fail((error) => {
                  console.log(error);
                });
              } else if (item['.tag'] == 'folder' && !(/(★|☆)$/.test(item.name))) {
                $dropboxImages.append(`
                <div class="card mb-2">
                  <button type="button" class="btn btn-outline-info btn-block fb-select-dropbox-folder" value="${folder}/${item.name}">${item.name}</button>
                </div>`)
              }
            });
            $dropboxDialog.modal('show');
            api.setOpacity();
          }).fail((error) => {
            api.handleError(error.responseText);
          });
        },

        readGoogleDrive: function(event) {
          api.initForm($dropboxDialog);
          var folder = $(event.target).val();
          $('#fb-dropbox-title').val($(event.target).text());
          $dropboxImages.empty();
          google.listFolder(folder).then((res) => {
            res.result.files.forEach((item) => {
              if (item.mimeType == 'application/vnd.google-apps.folder' && !(/(★|☆)$/.test(item.name))) {
                $dropboxImages.append(`
                <div class="card mb-2">
                  <button type="button" class="btn btn-outline-info btn-block fb-select-google-folder" value="${item.id}">${item.name}</button>
                </div>`)
              } else {
                if (item.mimeType.match(/image\/.+/i)) {
                  var dropboxItem = $.parseHTML(dropboxImageTemplate);
                  $dropboxImages.append(dropboxItem);
                  var directUrl = item.webContentLink.replace('&export=download', '');
                  //var directUrl = item.thumbnailLink.replace(/=s[0-9]+$/, '=s0');
                  console.log(directUrl);
                  $(dropboxItem).find('input[name="fb-dropbox-image"]').attr('value', directUrl);
                  $(dropboxItem).find('.fb-dropbox-image').text(item.name.replace(/\.[^/.]+$/, ''));
                  $(dropboxItem).find('img').attr('src', directUrl);
                  $(dropboxItem).find('img').attr('alt', item.modifiedTime);
                }
              }
            })
          });
          $dropboxDialog.modal('show');
          api.setOpacity();
      },

        addAlbum: function(event) {
          api.initForm($('#fb-album-dialog'));
          $('#fb-album-dialog').modal('show');
        },

        getAlbum: function(event) {
          return {
            id: $('#fb-album-name').val(),
            fields: {
            }
          }
        },

        validateAlbum: function(album, callback) {
          if ($('#fb-album-form').get(0).checkValidity() === true) {
            if (callback) {
              callback();
              albums.add(album);
              var newAll = albums.getAllSelectPure();
              var newValue = $albumsSelect.value();
              newValue.push(album.id);
              $('#fb-album-dialog').modal('hide');
              $albumsSelect = createSelectPure('#fb-post-albums', newAll, newValue);
              $($('<option>', {value: album.id}).append(album.id)).appendTo($searchAlbum);
            }
          } else {
            $('#fb-album-form').addClass('was-validated');
          }
        },

        addWoman: function(event) {
          api.initForm($('#fb-woman-dialog'));
          $('#fb-woman-dialog').modal('show');
        },

        getWoman: function(event) {
          return {
            id: $('#fb-woman-name').val(),
            fields: {
              phoneticName: $('#fb-woman-phonetic-name').val()
            }
          }
        },

        validateWoman: function(woman, callback) {
          if ($('#fb-woman-form').get(0).checkValidity() === true) {
            if (callback) {
              callback();
              women.add(woman);
              var newAll = women.getAllSelectPure();
              var newValue = $womenSelect.value();
              newValue.push(woman.id);
              $('#fb-woman-dialog').modal('hide');
              $womenSelect = createSelectPure('#fb-post-women', newAll, newValue);
              $womenSelectSearch = createSelectPure('#fb-post-women-search', newAll);
            }
          } else {
            $('#fb-woman-form').addClass('was-validated');
          }
        },

        addAuthor: function(event) {
          api.initForm($('#fb-author-dialog'));
          $('#fb-author-dialog').modal('show');
        },

        getAuthor: function(event) {
          return {
            id: $('#fb-author-name').val(),
            fields: {
              phoneticName: $('#fb-author-phonetic-name').val()
            }
          }
        },

        validateAuthor: function(author, callback) {
          if ($('#fb-author-form').get(0).checkValidity() === true) {
            if (callback) {
              callback();
              authors.add(author);
              var newAll = authors.getAllSelectPure();
              var newValue = $authorsSelect.value();
              newValue.push(author.id);
              $('#fb-author-dialog').modal('hide');
              $authorsSelect = createSelectPure('#fb-post-authors', newAll, newValue);
              $authorsSelectSearch = createSelectPure('#fb-post-authors-search', newAll);
            }
          } else {
            $('#fb-author-form').addClass('was-validated');
          }
        },

        addTag: function(event) {
          api.initForm($('#fb-tag-dialog'));
          $('#fb-tag-dialog').modal('show');
        },

        getTag: function(event) {
          return {
            id: $('#fb-tag-name').val(),
            fields: {
              phoneticName: $('#fb-tag-phonetic-name').val()
            }
          }
        },

        validateTag: function(tag, callback) {
          if ($('#fb-tag-form').get(0).checkValidity() === true) {
            if (callback) {
              callback();
              tags.add(tag);
              var newAll = tags.getAllSelectPure();
              var newValue = $tagsSelect.value();
              newValue.push(tag.id);
              $('#fb-tag-dialog').modal('hide');
              $tagsSelect = createSelectPure('#fb-post-tags', newAll, newValue);
              $tagsSelectSearch = createSelectPure('#fb-post-tags-search', newAll);
            }
          } else {
            $('#fb-tag-form').addClass('was-validated');
          }
        },

        showSettings: function() {
          api.initForm($settingsDialog);
          $settingsDialog.modal('show');
        },

        getSettings: function() {
          return {
            dropboxCode: $dropboxCode.val()
          };
        }
      };
    }
  };
});
