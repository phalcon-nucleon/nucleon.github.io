(function (window, document, $, M) {
  function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    var  tmp, i, j, la, lb, prev, val;

    la = a.length;
    lb = b.length;
    // swap to save some memory O(min(a,b)) instead of O(a)
    if (la > lb) {
      tmp = a;
      a = b;
      b = tmp
    }

    var row = Array(la + 1);
    // init the row
    for (i = 0; i <= la; i++) {
      row[i] = i
    }

    // fill in the rest
    for (i = 1; i <= lb; i++) {
      prev = i;
      for (j = 1; j <= la; j++) {
        if (b[i-1] === a[j-1]) {
          val = row[j-1] // match
        } else {
          val = Math.min(row[j-1] + 1, // substitution
            Math.min(prev + 1,     // insertion
              row[j] + 1))  // deletion
        }
        row[j - 1] = prev;
        prev = val
      }
      row[la] = prev
    }
    return row[la]
  }

  function slug(str){
    return str.toLowerCase().replace(/[^a-zA-Z\d]/g, '-').replace(/-+/g, '-');
  }
  var hasOwn = Object.prototype.hasOwnProperty;

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
      })
    },
    select: function ($elem) {
      $('#slide-out').find('li.active > a[data-template]').parent().removeClass('active');
      $elem.parent().addClass('active');
      M.Collapsible.getInstance($elem.parents('.collapsible').get(0)).open($elem.parents('.no-padding').index());
    }
  };

  var Template = {
    current: null,
    version: null,
    init: function () {
      $(window).on("popstate", function () {
        Template.show(location.hash.match(/^\#\!([^@]+)/)[1]);
      });
    },
    ready: function () {
      if (location.hash.substring(0, 2) === '#!') {
        Template.show(location.hash.match(/^\#\!([^@]+)/)[1]);
      }
    },
    show: function (template) {
      if (Template.current === template) {
        return;
      }

      Template.current = template;

      Sidenav.select($('a[href="#!' + template + '"]'));

      Loader.ajax({
        url: 'templates/' + template
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

          return '<a target="_blank" href="https://docs.phalconphp.com/en/3.3/api/' + c[0].replace(/^\\/, '').replace(/\\/g, '_') + '"><code>' + match + '</code></a>';
        });

        window.scrollTo(0, 0);

        $('[data-template-title]').text(template.replace(/.+\/(.+).html/, '$1').replace(/[_-]/g, ' ').replace(/^(.)|\s+(.)/g, function ($1) {
          return $1.toUpperCase()
        }));
        $('[data-template-container]').html(data);

        $('body').trigger('template.show');
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
      var match = location.hash.match(/\#\!.+@(.+)/);

      if (match) {
        $('[data-anchor="' + match[1] + '"]').scrollTo();
      }
    }
  };

  var Summary = {
    init: function () {
      Template.onShow(Summary.generate)
    },
    generate: function () {
      if (!$('.summary.generate').length) {
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

      $('.summary.generate').html(lis);
    }
  };

  var Search = {
    __data: {
      "architecture-concepts/dependency-injection.html": ['di', 'dependency', 'injection', 'container'],
      "architecture-concepts/global-architecture.html": ['start'],
      "architecture-concepts/kernels-concepts.html": ['kernel'],
      "architecture-concepts/modules-concepts.html": ['module'],
      "basics/controllers.html": ['controller'],
      "basics/csrf-protection.html": ['csrf', 'security'],
      "basics/middleware.html": ['middleware'],
      "basics/requests.html": ['request'],
      "basics/responses.html": ['response'],
      "basics/routing.html": ['routing', 'route'],
      "basics/views.html": ['view', 'template'],
      "database/getting-started.html": ['database'],
      "database/migrations.html": ['migrations'],
      "database/models.html": ['model', 'entity'],
      "database/queries-phql.html": ['query', 'queries', 'phql'],
      "database/relationships.html": ['relationships', 'relation'],
      "database/repositories.html": ['repositories', 'repository'],
      "debug/debug-toolbar.html": ['debug', 'helper'],
      "debug/debugging.html": ['debug'],
      "debug/profilers.html": ['profile'],
      "debug/var-dumper.html": ['dump', 'debug'],
      "digging-deeper/helpers.html": ['helpers', 'arr', 'str'],
      "digging-deeper/quark-console.html": ['quark', 'console'],
      "digging-deeper/volt.html": ['volt', 'template'],
      "getting-started/configuration.html": ['start', 'configuration'],
      "getting-started/directory-structure.html": ['start', 'structure'],
      "getting-started/installation.html": ['start', 'installation'],
      "kernels-concepts/cli-kernel.html": ['cli', 'kernel'],
      "kernels-concepts/http-kernel.html": ['http', 'kernel'],
      "kernels-concepts/micro-kernel.html": ['micro', 'kernel'],
      "performance/application.html": ['performance'],
      "performance/php-and-server.html": ['performance']
    },
    init: function () {
      $('#search').on('keyup focus', function () {
        Search.search($(this).val())
      });

      $('.search').on('click', 'a', function(){
        $('.search-results').empty();
      });

      $('body').on('click', function (ev) {
        var $target = $(ev.target);
        if (!($target.is('.search') || $target.parents('.search').length)) {
          $('.search-results').empty();
        }
      })
    },
    search: function (value) {
      if (!value || !(value.trim())) {
        return;
      }

      var datas = Search.__data;
      var values = value.trim().toLowerCase().split(' ');
      var found = {};

      var ref, refs, i, l;

      for (refs = values, i = 0, l = refs.length; i < l; i++) {
        ref = refs[i];

        for (var template in datas) {
          if (hasOwn.call(datas, template)) {
            for (var keyword, keywords = datas[template], k = 0, kl = keywords.length; k < kl; k++) {
              keyword = keywords[k];

              if (ref.indexOf(keyword) !== -1 || keyword.indexOf(ref) !== -1) {
                if (hasOwn.call(found, template)) {
                  found[template] += levenshtein(keyword, template)
                } else {
                  found[template] = levenshtein(keyword, template)
                }
                break;
              }
            }
          }
        }
      }

      var sfound = [];
      for (k in found) {
        if (hasOwn.call(found, k)) sfound.push([k, found[k]])
      }
      sfound.sort(function (a, b) {
        return b[1] - a[1];
      });


      var $found = $('.search-results').empty();

      for (i = 0, l = sfound.length; i < l; i++) {
        ref = sfound[i][0];
        $found.append($('<a href="#!'+ref+'">' + ref.replace(/.+\/([\w-]+.html)/, '$1') + '</a>'))
      }
    }
  };

  var Main = {
    init: function () {
      M.AutoInit();
      Summary.init();
      Sidenav.init();
      HAnchor.init();
      Search.init();
      Template.init();

      Template.onShow(function () {
        var $elem = $('#slide-out').find('li.active > a[data-template]');
        document.title = $elem.parents('.no-padding').find('> a > span:first').text() + ': ' + $elem.text() + ' - Nucleon - PHP Framework build with Phalcon';
      });

      Template.onShow(Prism.highlightAll);
    },
    ready: function () {
      Template.ready();
    }
  };

  $.fn.scrollTo = function () {
    if ($(this).length) {
      $('html, body').animate({
        scrollTop: $(this).offset().top
      }, 300);
    }
  };

  Main.init();
  Main.ready();

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

})(window, document, jQuery, M);
