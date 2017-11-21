var Application = {
   initApplication: function () {
      $(document)
         .on('pageinit', '#add-feed-page', function () {
            Application.initAddFeedPage();
         })
         .on('pageinit', '#list-feeds-page', function () {
            Application.initListFeedPage();
         })
         .on('pageinit', '#show-feed-page', function () {
            var url = this.getAttribute('data-url').replace(/(.*?)url=/g, '');
            Application.initShowFeedPage(url);
         })
         .on('pageinit', '#show-news-feed-page', function () {
            var url = 'http://www.flashecarry.it/json/news.php';
            Application.initShowNewsFeedPage(url);
         })
         .on('pageinit', '#offerte-oggi-page', function () {
            var url = 'http://ecommerce.flashecarry.it/json/offerte.php';
            Application.initOfferteOggiPage(url);
         })
         .on('pageinit', '#copyright-page', function () {
            Application.initCopyrightPage();
         })
         .on('pageinit', '#logon-page', function () {
            Application.initLogonPage();
         })
         .on('backbutton', function () {
		   if(document.getElementById('#mainpage')){
	           e.preventDefault();
    	       navigator.app.exitApp();
	       } else {
    	       //navigator.app.backHistory()
		        $.mobile.changePage('index.html');
	       }         
         })
         .on('menubutton', function () {
			$( "#mypanel" ).panel( "open" );
         });
      Application.openLinksInApp();
   },
   initAddFeedPage: function () {
      $('#add-feed-form').submit(function (event) {
         event.preventDefault();
         var feedName = $('#feed-name').val().trim();
         var feedUrl = $('#feed-url').val().trim();
         if (feedName === '') {
            navigator.notification.alert('Name field is required and cannot be empty', function () {
            }, 'Error');
            return false;
         }
         if (feedUrl === '') {
            navigator.notification.alert('URL field is required and cannot be empty', function () {
            }, 'Error');
            return false;
         }

         if (Feed.searchByName(feedName) === false && Feed.searchByUrl(feedUrl) === false) {
            var feed = new Feed(feedName, feedUrl);
            feed.add();
            navigator.notification.alert('Feed salvato correttamente', function () {
               $.mobile.changePage('index.html');
            }, 'Completato');
         } else {
            navigator.notification.alert('Feed not saved! Either the Name or the Url specified is already in use', function () {
            }, 'Error');
         }
         return false;
      });
   },
   initListFeedPage: function () {
      var $feedsList = $('#feeds-list');
      var items = Feed.getFeeds();
      var htmlItems = '';

      $feedsList.empty();
      items = items.sort(Feed.compare);
      for (var i = 0; i < items.length; i++) {
         htmlItems += '<li><a href="show-feed.html?url=' + items[i].url + '">' + items[i].name + '</a></li>';
      }
      $feedsList.append(htmlItems).listview('refresh');
   },
   initShowFeedPage: function (url) {
      var step = 10;
      var loadFeed = function () {
         var currentEntries = $('#feed-entries').find('div[data-role=collapsible]').length;
         var entriesToShow = currentEntries + step;
         $.ajax({
            url: 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=' + entriesToShow + '&q=' + encodeURI(url),
            dataType: 'json',
            beforeSend: function () {
               $.mobile.loading('show', {
                  text: 'Please wait while retrieving data...',
                  textVisible: true
               });
            },
            success: function (data) {
               var $list = $('#feed-entries');
               if (data.responseData === null) {
                  navigator.notification.alert('Unable to retrieve the Feed. Invalid URL', function () {
                  }, 'Error');
                  return;
               }
               var items = data.responseData.feed.entries;

               var $post;
               if (currentEntries === items.length) {
                  navigator.notification.alert('No more entries to load', function () {
                  }, 'Info');
                  return;
               }
               for (var i = currentEntries; i < items.length; i++) {
                  $post = $('<div data-role="collapsible" data-expanded-icon="arrow-d" data-collapsed-icon="arrow-r" data-iconpos="right">');
                  $post
                     .append($('<h2>').text(items[i].title))
                     .append($('<h3>').html('<a href="' + items[i].link + '" target="_blank">' + items[i].title + '</a>')) // Add title
                     .append($('<p>').html(items[i].contentSnippet)) // Add description
                     .append($('<p>').text('Author: ' + items[i].author))
                     .append(
                        $('<a href="' + items[i].link + '" target="_blank" data-role="button">')
                           .text('Go to the Article')
                           .button()
                           .click(function (event) {
                              if (Application.checkRequirements() === false) {
                                 event.preventDefault();
                                 navigator.notification.alert('The connection is off, please turn it on', function () {
                                 }, 'Error');
                                 return false;
                              }
                              $(this).removeClass('ui-btn-active');
                           })
                     );
                  $list.append($post);
               }
               $list.collapsibleset('refresh');
            },
            error: function () {
               navigator.notification.alert('Unable to retrieve the Feed. Try later', function () {
               }, 'Error');
            },
            complete: function () {
               $.mobile.loading('hide');
            }
         });
      };
      $('#show-more-entries').click(function () {
         loadFeed();
         $(this).removeClass('ui-btn-active');
      });
      $('#delete-feed').click(function () {
         Feed.searchByUrl(url).delete();
         navigator.notification.alert('Feed deleted', function () {
            $.mobile.changePage('list-feeds.html');
         }, 'Success');
      });
      if (Application.checkRequirements() === true) {
         loadFeed();
      } else {
         navigator.notification.alert('To use this app you must enable your internet connection', function () {
         }, 'Warning');
      }
   },
   initShowNewsFeedPage: function (url) {
      var loadNewsFeed = function () {
         var currentEntries = $('#feed-entries').find('div[data-role=collapsible]').length;
         $.ajax({
            url: url,
            data: { offset: currentEntries },
            dataType: 'json',
            beforeSend: function () {
               $.mobile.loading('show', {
                  text: 'Attendi, scarico le ultime news...',
                  textVisible: true
               });
            },
            success: function (data) {
               var $list = $('#feed-entries');

/*
               if (!data.length) {
                  navigator.notification.alert('Unable to retrieve the Feed. Invalid URL', function () {
                  }, 'Error');
                  return;
               }
*/
               var $post;

               if (!data.count) {
                  navigator.notification.alert('Finite!!!', function () {}, 'Info');
                  $('#show-more-entries').hide();
                  return;
               }


				$.each(data.news, function(index, element) {
                  $post = $('<div data-role="collapsible" data-collapsed="false" data-expanded-icon="arrow-d" data-collapsed-icon="arrow-r" data-iconpos="right">');
                  $post
                  		.append('<img style="width:100%;" src="'+element.foto+'"   />')
                     	.append($('<h2>').text(element.titolo))
//                     .append($('<h3>').html('<a href="' + items[i].link + '" target="_blank">' + items[i].title + '</a>')) // Add title
                     	.append($('<p>').html(element.highlight)) // Add description
//                     .append($('<p>').text('Author: ' + items[i].author))
	                  	.append('<a href="'+element.url+'" target="_blank" data-role="button">vai al sito</a>')

                  $list.append($post);
		        });


/*
               if (currentEntries === data.length) {
                  navigator.notification.alert('No more entries to load', function () {
                  }, 'Info');
                  return;
               }
               for (var i = currentEntries; i < data.length; i++) {
                  $post = $('<div data-role="collapsible" data-expanded-icon="arrow-d" data-collapsed-icon="arrow-r" data-iconpos="right">');
                  $post
                     .append($('<h2>').text(data[i].titolo))
//                     .append($('<h3>').html('<a href="' + items[i].link + '" target="_blank">' + items[i].title + '</a>')) // Add title
                     .append($('<p>').html(data[i].highlight)) // Add description
//                     .append($('<p>').text('Author: ' + items[i].author))
                     .append(
                        $('<a href="' + items[i].link + '" target="_blank" data-role="button">')
                           .text('Go to the Article')
                           .button()
                           .click(function (event) {
                              if (Application.checkRequirements() === false) {
                                 event.preventDefault();
                                 navigator.notification.alert('The connection is off, please turn it on', function () {
                                 }, 'Error');
                                 return false;
                              }
                              $(this).removeClass('ui-btn-active');
                           })
                     );
                  $list.append($post);
               }
*/
               $list.collapsibleset('refresh');

				//navigator.notification.alert(data.count, function () {}, 'Conta');				
				$('#moreentriesdesc').text((currentEntries+data.count) + ' visualizzate, ');
            },
            error: function () {
               navigator.notification.alert('Unable to retrieve the Feed. Try later', function () {
               }, 'Error');
            },
            complete: function () {
               $.mobile.loading('hide');
            }
         });
      };
      $('#show-more-entries').click(function () {
         loadNewsFeed();
         $(this).removeClass('ui-btn-active');
      });
      if (Application.checkRequirements() === true) {
         loadNewsFeed();
      } else {
         navigator.notification.alert('To use this app you must enable your internet connection', function () {
         }, 'Warning');
      }
   },
   initOfferteOggiPage: function (url) {
		  var loadOfferteOggiFeed = function () {
	      var currentEntries = $('#listview').find('li').length;
		  var username = '';
		  var password = '';
	   	  if (window.localStorage.getItem('setup') !== null) {
			  var setup = JSON.parse(window.localStorage.getItem('setup'));
			  username = setup['username'];
			  password = setup['password'];
			  //navigator.notification.alert('setup:'+setup['username'], function () {}, 'Error');
		  } else {
		  }

         $.ajax({
            url: url,
            data: { username: username, password: calcMD5(password), offset: currentEntries },
            dataType: 'json',
            beforeSend: function () {
               $.mobile.loading('show', {
                  text: 'Attendi, scarico le ultime offerte...',
                  textVisible: true
               });
            },
            success: function (data) {
               var $list = $('#listview');
               var post;

               if (!data.count) {
                  navigator.notification.alert('Finite!!!', function () {}, 'Info');
                  $('#show-more-entries').hide();
                  return;
               }

				$.each(data.offerte, function(index, element) {
                  post = '<li class="ui-btn ui-li ui-li-has-thumb ui-btn-up-a" data-corners="false" data-shadow="false" data-iconshadow="false" data-wrapperels="div" data-icon="none" data-iconpos="right" data-theme="a">';
                  post = post + '<div class="ui-btn-inner ui-li">';
                  post = post + '<div class="ui-btn-text">';
                  post = post + '<a class="ui-link-inherit" target="_blank" href="'+element.url+'">';
                  post = post + '<img class="ui-li-thumb" src="'+element.foto+'"/>';
                  post = post + '<h3 class="ui-li-heading">'+element.descrizione+'</h3>';
                  post = post + '<p class="ui-li-desc">Cod. '+element.cod+' - EAN: '+element.barcode+'<br />';
                  post = post + 'Prezzo offerta: '+element.prezzo+'<br />';
                  post = post + '</p></a>';
                  post = post + '</div>';
                  //post = post + '<span class="ui-icon ui-icon-arrow-r ui-icon-shadow"></span>';
                  post = post + '</li>';
                  $list.append(post);
		        });

               //$list('refresh');
				//navigator.notification.alert(data.count, function () {}, 'Conta');				
				$('#moreentriesdesc').text((currentEntries+data.count) + ' visualizzate, ');

            },
            error: function () {
               navigator.notification.alert('Impossibile contattare il server... riprova', function () {
               }, 'Error');
            },
            complete: function () {
               $.mobile.loading('hide');
            }
         });
      };
      $('#show-more-entries').click(function () {
         loadOfferteOggiFeed();
         $(this).removeClass('ui-btn-active');
      });

      if (Application.checkRequirements() === true) {
         loadOfferteOggiFeed();
      } else {
         navigator.notification.alert('To use this app you must enable your internet connection', function () {
         }, 'Warning');
      }
   },
   initCopyrightPage: function () {
      $('a[target=_blank]').click(function () {
         $(this).closest('li').removeClass('ui-btn-active');
      });
   },
   initLogonPage: function () {      
   	  if (window.localStorage.getItem('setup') !== null) {
		  var setup = JSON.parse(window.localStorage.getItem('setup'));
		  $('#username').val(setup['username']);
		  $('#password').val(setup['password']);
	      //navigator.notification.alert('setup:'+setup['username'], function () {}, 'Error');
	  }

      $('#logon-form').submit(function (event) {
         event.preventDefault();
         var username = $('#username').val().trim();
         var password = $('#password').val().trim();
         if (username === '') {
            navigator.notification.alert('Username is required and cannot be empty', function () {
            }, 'Error');
            return false;
         }
         if (password === '') {
            navigator.notification.alert('Password field is required and cannot be empty', function () {
            }, 'Error');
            return false;
         }

         navigator.notification.alert('Dati salvati!', function () {}, 'Completato');

		 var setupout = { username: username, password: password, passwordmd5: calcMD5(password) };
		 window.localStorage.setItem('setup', JSON.stringify(setupout));

         return false;
      });
   },
   checkRequirements: function () {
      if (navigator.connection.type === Connection.NONE) {
         return false;
      }

      return true;
   },
   updateIcons: function () {
      var $buttons = $('a[data-icon], button[data-icon]');
      var isMobileWidth = ($(window).width() <= 480);
      isMobileWidth ? $buttons.attr('data-iconpos', 'notext') : $buttons.removeAttr('data-iconpos');
   },
   openLinksInApp: function () {

       if (window.localStorage.getItem('fbook') !== null) {
           var fbook = window.localStorage.getItem('fbook');
       } else var fbook = '';

       /*$.ajax({
           url: 'http://www.flashecarry.it/fbook.php',
           data: { },
           dataType: 'json',
           success: function (data) {
               if (data.result.length && fbook != data.result) {
                   navigator.notification.alert('Disponibile nuova versione del volantino sul sito '+data.result, function () {}, 'Nuova versione');
                   window.localStorage.setItem('fbook', data.result);
                   $('#volantino-r').attr('href', data.result);
                   console.log('qui')
                   return;
               }
           },
           error: function () {
               console.log('li')
               navigator.notification.alert('Unable to retrieve the Feed. Try later', function () {}, 'Error');
           }
       });*/

      $(document).on('click', 'a[target=_blank]', function (event) {
         event.preventDefault();
         window.open($(this).attr('href'), '_blank');
      });
      
      $(document).on('click', '#exitbutton', function (event) {
         event.preventDefault();
		 navigator.app.exitApp();
      });

      $(document).on('click', '#dialphone', function (event) {
         window.open('tel:+390975322675', '_system');
      });
      
   }
};
