(function (window, document, $, M) {

  /**
   * @const
   * @type {RegExp}
   */
  var REGEX_ROUTE_WITH_VERSION = /^\#\!(\d+\.\d+)\/(?:([\w-]+)\/([\w-]+)\.html)?(?:@(.+))?/;

  /**
   * @const
   * @type {RegExp}
   *
   * m[1] : version
   * m[2] : section
   * m[3] : item
   * m[4] : anchor
   */
  var REGEX_ROUTE = /^\#\!(?:(\d+\.\d+)\/?)?(?:([\w-]+)\/([\w-]+)\.html)?(?:@(.+))?/;

  /**
   * @const
   * @type {string}
   */
  var PHALCON_DOCS_VERSION = "3.4";

  function phdocs(path) {
    return "https://docs.phalconphp.com/en/" + PHALCON_DOCS_VERSION + path;
  }

  $.fn.scrollTo = function () {
    if ($(this).length) {
      $('html, body').animate({
        scrollTop: $(this).offset().top
      }, 300);
    }
  };

  if (window.navigator.userAgent.indexOf("MSIE ")) {
    (function () {
      var hash = location.hash;
      $('body').on('click', function () {
        setTimeout(function () {
          if (hash !== location.hash) {
            hash = location.hash;
            $(window).trigger('popstate');
          }
        })
      })
    })()
  }

  function isXLarge() {
    return window.innerWidth > 1200;
  }

  function isLarge() {
    return window.innerWidth > 992 && window.innerWidth <= 1200;
  }

  function isMedium() {
    return window.innerWidth > 600 && window.innerWidth <= 992;
  }

  function isSmall() {
    return window.innerWidth <= 600
  }

  function slug(str) {
    return str.toLowerCase().replace(/[^a-zA-Z\d]/g, '-').replace(/-+/g, '-');
  }

  var hasOwn = Object.prototype.hasOwnProperty;

  var Locash = {
    getInfos: function (uri) {
      var m = (uri || location.hash).match(REGEX_ROUTE);

      return {
        version: m && m[1] ? m[1] : null,
        section: m && m[2] ? m[2] : null,
        item: m && m[3] ? m[3] : null,
        anchor: m && m[4] ? m[4] : null,
      }
    },
    getVersion: function () {
      return Locash.getInfos().version;
    },
    getSection: function () {
      return Locash.getInfos().section;
    },
    getItem: function () {
      return Locash.getInfos().item;
    },
    getAnchor: function () {
      return Locash.getInfos().anchor;
    }
  };

  var Routes = {
    route: function () {
      var route = Locash.getInfos();

      return Metadata.getRoute(route.section, route.item);
    },
    uri: function (route) {
      return Version.get() + '/' + (route || Routes.route()).path;
    },
  };

  var Version = {
    init: function () {
      // handle version change
      $('.version').on('click', 'li', function () {
        var value = $(this).attr('data-value');
        var current = Version.get();

        if (value !== current) {
          Version.repaint(value);
          location.hash = '!' + Routes.uri();
          Sidenav.build();

          //Version.linkScope($('#slide-out'))
        }
      });

      Version.repaint(Locash.getVersion());
    },
    get: function () {
      return $('.version > a').text().trim();
    },
    all: function () {
      var versions = [];

      $('.version li[data-value]').each(function(){
        versions.push($(this).data('value'))
      });

      return versions;
    },
    repaint: function (version) {
      if (version) {
        var $version = $('.version');
        $version.find('li').removeClass('active');
        $version.find('li[data-value="' + version + '"]').addClass('active');
        $version.find('> a').html(version);
      }
    },
    linkScope: function ($scope) {
      var version = Version.get();

      $scope.find('a[href^="#!"]').each(function () {
        var $this = $(this);

        var href = $(this).attr('href').substring(2);

        // if contains version
        if (/^(\d+\.\d+)\/(.+)/.test(href)) {
          // remove version
          href = /^(\d+\.\d+)\/(.+)/.exec(href)[2];
        }

        $this.attr('href', "#!" + version + '/' + href)
      });
    }
  };

  var Loader = {
    show: function () {
      $('.preloader').addClass('active');
    },
    hide: function () {
      $('.preloader').removeClass('active');
    },
    ajax: function () {
      Loader.show();

      return $.ajax.apply($, arguments).always(function () {
        Loader.hide();
      })
    }
  };

  var Sidenav = {
    init: function () {
      var $slide = $('#slide-out');
      $slide.find('.collapsible').collapsible({
        onOpenStart: function (elem) {
          $(elem).find('i').text('keyboard_arrow_down');
        },
        onCloseStart: function (elem) {
          $(elem).find('i').text('keyboard_arrow_right');
        }
      });

      $slide.on('click', 'a[data-template]', function () {
        Sidenav.select($(this))
      });

      Sidenav.build();
    },
    select: function ($elem) {
      if ($elem.length) {
        var $slide = $('#slide-out');
        $slide.find('li.active > a[data-template]').parent().removeClass('active');
        $elem.parent().addClass('active');
        M.Collapsible.getInstance($elem.parents('.collapsible').get(0)).open($elem.parents('.no-padding').index());
        if (isSmall() || isMedium()) {
          var inst = M.Sidenav.getInstance($slide[0]);
          inst.isOpen = true;
          inst.close();
        }
      }
    },
    build: function () {
      var sections = Metadata.getData().sections;
      var $sections, $items, version = Version.get();

      $sections = '';
      for (var section, i = 0, l = sections.length; i < l; i++) {
        section = sections[i];

        $items = '';
        for (var items = section.items, item, j = 0, m = items.length; j < m; j++) {
          item = items[j];
          $items += '<li><a href="#!' + version + '/' + section.path + '/' + item.path + '" data-template>' + item.name + '</a></li>';
        }

        $sections += '<li class="no-padding">' +
          '<a class="collapsible-header"><span>' + section.name + '</span><i class="material-icons">keyboard_arrow_right</i></a>' +
          '<div class="collapsible-body">' +
          '<ul>' +
          $items +
          '</ul>' +
          '</div>' +
          '</li>'
      }

      $('#menu-links').empty().append($($sections));
    },
  };

  var Template = {
    current: null,
    init: function () {
      $(window).on("popstate", function () {
        Template.show();
      });
    },
    ready: function () {
      if (location.hash.substring(0, 2) === '#!') {
        Template.show();
      }
    },
    show: function () {
      var route = Routes.route();
      var template = route && route['url'] ? route['url'] : null;
      var name = route && route['name'] ? route['name'] : null;

      if (!template || !name || Template.current === template) {
        return;
      }

      Template.current = template;

      Sidenav.select($('a[href="#!' + name + '"][data-template]'));
      Sidenav.select($('a[href="#!' + template + '"][data-template]'));

      Loader.ajax({
        url: 'docs/' + template
      }).done(function (data) {
        function split(splitters, str) {
          for (var p, i = 0, l = splitters.length; i < l; i++) {
            p = str.split(splitters[i]);
            if (p.length > 1) {
              return p;
            }
          }

          return [str];
        }

        data = data.replace(/<code>\\?(Phalcon\\.+)<\/code>/gm, function (g, match) {
          var c = split(['::', '-&gt;', '->'], match);

          return '<a target="_blank" href="' + phdocs('/api/' + c[0].replace(/^\\/, '').replace(/\\/g, '_')) + '"><code>' + match + '</code></a>';
        });

        window.scrollTo(0, 0);

        var $template_title = $('[data-template-title]');
        var $template_container = $('[data-template-container]');

        $template_title.text(name.replace(/.+\/(.+).html/, '$1').replace(/[_-]/g, ' ').replace(/^(.)|\s+(.)/g, function ($1) {
          return $1.toUpperCase()
        }));
        $template_container.html(data);

        Version.linkScope($template_container);

        Sidenav.select($('a[href="#!' + name + '"][data-template]'));
        Sidenav.select($('a[href="#!' + template + '"][data-template]'));

        $('body').trigger('template.show');
      }).fail(function () {
        window.scrollTo(0, 0);

        $('[data-template-title]').text("404 - not found");
        $('[data-template-container]').html(
          '<div class="row">' +
          '<div class="col s12">' +
          '<div class="card blue-grey darken-1">' +
          '<div class="card-content white-text">' +
          '<span class="card-title">Whoops ! Something went wrong !</span>' +
          '<p>The page your looking for, was not found.</p>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '</div>'
        );
      })
    },
    onShow: function (callback) {
      $('body').on('template.show', callback);
    }
  };

  var HAnchor = {
    init: function () {
      Template.onShow(HAnchor.scrollTo);
      $(window).on("popstate", HAnchor.scrollTo);
    },
    scrollTo: function () {
      var anchor = Locash.getAnchor();

      if (anchor) {
        $('[data-anchor="' + anchor + '"]').scrollTo();
      }
    }
  };

  var Summary = {
    init: function () {
      Template.onShow(Summary.generate)
    },
    generate: function () {
      var summary = $('.summary.generate');

      if (!summary.length) {
        return;
      }

      var o = [], h2, h3, base_url = '/' + location.hash.match(/^(\#\![^@]+)/)[1] + '@';

      $('h2, h3, h4').each(function () {
        switch (this.tagName) {
          case 'H2':
            o.push(h2 = {
              name: this.innerHTML,
              slug: slug(this.innerText),
              items: []
            });
            h3 = null;
            break;
          case 'H3':
            h2.items.push(h3 = {
              name: this.innerHTML,
              slug: slug(this.innerText),
              items: []
            });
            break;
          case 'H4':
            (h3 || h2).items.push({
              name: this.innerHTML,
              slug: slug(this.innerText),
              items: []
            });
            break;
        }

        $(this).attr('data-anchor', slug(this.innerText))
      });

      function _gen_li(o) {
        var li = '<li><a href="' + base_url + o.slug + '">' + o.name + '</a>';

        if (o.items.length) {
          li += '<ul>';
          for (var i = 0, l = o.items.length; i < l; i++) {
            li += _gen_li(o.items[i]);
          }
          li += '</ul>';
        }

        return li + '</li>'
      }

      var lis = '';

      for (var i = 0, l = o.length; i < l; i++) {
        lis += _gen_li(o[i]);
      }

      summary.html(lis);
    }
  };

  var Search = {
    init: function () {
      var index = lunr(function () {
        this.k1(1.4);
        this.b(0.5);

        this.field('title', {boost: 10});
        this.field('body');
        this.ref('href');

        var documents = Metadata.getDocuments();

        for (var ref in documents) {
          if (hasOwn.call(documents, ref)) {
            this.add({
              href: ref,
              title: ref.replace('[\w-]+.([\w-]+).html'),
              body: documents[ref]
            })
          }
        }
      });

      $('#search').on('keyup focus', function (ev) {
        switch (ev.keyCode) {
          case 37:
          case 39:
            return;
          case 38:
            return Search.kup();
          case 40:
            return Search.kdown();
          case 13:
            var $sel = $('.search-results a.hover');
            if ($sel.length) {
              return Search.select($sel);
            } else {
              $sel = $('.search-results a:first-child');
              if ($sel.length) {
                return Search.select($sel);
              }
            }
        }

        var value = $(this).val();
        if (value.length < 2) {
          if (value.length === 0) {
            Search.empty();
          }
          return;
        }

        var values = value.replace(/ +/g, ' ').split(' ');

        value = values.join(' ') + ' ' + values.join('* ') + '*';

        Search.render(index.search(value).slice(0, 6));
      });

      $('.search').on('click', 'a', function () {
        Search.select();
      });

      $('body').on('click', function (ev) {
        var $target = $(ev.target);
        if (!($target.is('.search') || $target.parents('.search').length)) {
          Search.empty();
        }
      });

      $('.search-results').on('mouseenter', 'a', function () {
        $('.search-results a.hover').removeClass('hover');
        $(this).addClass('hover')
      })
    },
    render: function (founds) {
      var $found = $('.search-results').empty();
      for (var ref, i = 0, l = founds.length; i < l; i++) {
        ref = founds[i].ref;
        $found.append($('<a href="' + ref + '">' + ref.replace(/.+\/([\w-]+.html)/, '$1') + '</a>'))
      }
    },
    kup: function () {
      var $a = $('.search-results a'),
        $sel = $a.filter('.hover');

      if ($sel.length) {
        if ($sel.prev().length) {
          $sel.prev().addClass('hover');
        } else {
          $a.last().addClass('hover');
        }
        $sel.removeClass('hover')
      } else {
        $a.last().addClass('hover');
      }
    },
    kdown: function () {
      var $a = $('.search-results a'),
        $sel = $a.filter('.hover');

      if ($sel.length) {
        if ($sel.next().length) {
          $sel.next().addClass('hover');
        } else {
          $a.first().addClass('hover');
        }
        $sel.removeClass('hover')
      } else {
        $a.first().addClass('hover');
      }
    },
    select: function ($sel) {
      if ($sel) {
        location.hash = $sel.attr('href');
      }

      $("#search").val('');
      Search.empty();
    },
    empty: function () {
      $('.search-results').empty();
    }
  };

  var Metadata = {
    metadata: {},
    documents: {},
    routes: {},
    init: function () {
      var versions = Version.all();
      var promises = [];

      for (var i = 0, l = versions.length; i < l; i++) {
        promises.push((function (version) {
          return $.ajax({
            url: "docs/" + version + "/metadata.json"
          }).then(function (data) {
            Metadata.metadata[version] = data;
            Metadata.documents[version] = Metadata.buildDocuments(data.sections || []);
            Metadata.routes[version] = Metadata.buildRoutes(data.sections || [], version);
          })
        })(versions[i]))
      }

      return Promise.all(promises);
    },
    buildDocuments: function (sections) {
      var documents = {};

      for (var section, i = 0, l = sections.length; i < l; i++) {
        section = sections[i];
        for (var items = section.items, item, j = 0, m = items.length; j < m; j++) {
          item = items[j];
          documents['#!' + section.path + '/' + item.path] = item.keywords;
        }
      }

      return documents;
    },
    buildRoutes: function (sections, version) {
      var routes = {};

      for (var section, i = 0, l = sections.length; i < l; i++) {
        section = sections[i];
        for (var items = section.items, item, j = 0, m = items.length; j < m; j++) {
          item = items[j];
          routes[section.path + '/' + item.path] = {
            url: version + '/' + section.path + '/' + item.path,
            path: section.path + '/' + item.path,
            name: item.name,
          };
        }
      }

      return routes;
    },
    getDocuments: function () {
      var version = Version.get();

      return Metadata.documents[version];
    },
    getRoutes: function () {
      var version = Version.get();

      return Metadata.routes[version];
    },
    getRoute: function (section, item) {
      return Metadata.routes[Version.get()][section + '/' + item + '.html'];
    },
    getData: function () {
      var version = Version.get();

      return Metadata.metadata[version];
    }
  };

  var Main = {
    init: function () {
      return Promise
        .resolve()
        .then(Version.init)
        .then(Metadata.init)
        .then(Summary.init)
        .then(Sidenav.init)
        .then(HAnchor.init)
        .then(Template.init)
        .then(M.AutoInit)
        .then(function () {
          Template.onShow(function () {
            var $elem = $('#slide-out').find('li.active > a[data-template]');
            document.title = $elem.parents('.no-padding').find('> a > span:first').text() + ': ' + $elem.text() + ' - Nucleon - PHP Framework build with Phalcon';
          });

          Template.onShow(function () {
            $('a[data-phalcon-link]').each(function () {
              var $this = $(this);

              $this.attr('href', phdocs($this.data('phalcon-link')));
              $this.attr('target', '_blank')
            })
          });

          Template.onShow(Prism.highlightAll);
        })
        .then(Template.ready)
        .then(function () {
          return new Promise(function (resolve) {
            $(document).ready(resolve);
          })
        })
    },
    ready: function () {
      return Promise
        .resolve()
        .then(Search.init);
    }
  };

  var __DEBUG__ = true;

  if (__DEBUG__) {
    var lvl = 0;

    function __debug__(object, name) {
      for (var prop in object) {
        if (object.hasOwnProperty(prop) && typeof object[prop] === 'function') {
          (function (prop, method) {
            object[prop] = function () {
              lvl++;
              console.log(' '.repeat(lvl*2), '>', name, prop, arguments);
              var result = method.apply(object, arguments);
              console.log(' '.repeat(lvl*2), '<', name, prop, result);
              lvl--;

              return result;
            }
          })(prop, object[prop]);
        }
      }
    }

    __debug__(Locash, 'locash');
    __debug__(Routes, 'routes');
    __debug__(Version, 'version');
    __debug__(Loader, 'loader');
    __debug__(Sidenav, 'sidenav');
    __debug__(Template, 'template');
    __debug__(HAnchor, 'anchor');
    __debug__(Summary, 'summary');
    __debug__(Search, 'search');
    __debug__(Metadata, 'metadata');
    __debug__(Main, 'main');
  }

  Main.init().then(Main.ready);

})(window, document, jQuery, M, lunr);
