(function($) {

  var containerExists;

  function arrayEach(arr, fn) {
    for(var i = 0; i < arr.length; i++) {
      fn(arr[i], i, arr);
    }
  }

  function arrayEvery(arr, fn) {
    for(var i = 0; i < arr.length; i++) {
      if(!fn(arr[i], i, arr)) {
        return false;
      }
    }
    return true;
  }

  function commaSeparate(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  $(document).bind('suite.finished', function(event, environment, results) {
    var totalTests = 0;
    var totalAssertions = 0;
    var totalFailed = 0;
    var env = $('#' + environment);
    // IE8 will throw an error in jQuery 1.8.1+ here when using .find,
    // so concat the string like this.
    var envId = '#' + environment;
    $(envId + ' .loading').hide();
    $(envId + ' .tests,.stats').show();
    $(envId + ' .tests').empty();

    arrayEach(results, function(module) {
      var mod = $('<ul class="module" />');
      arrayEach(module.results, function(r) {
        totalTests++;
        totalAssertions += r.assertions;
        totalFailed += r.failures.length;
        var li = $('<li class="test" />');
        var title = '<h5>' + r.name + (r.subname ? ' | ' + r.subname : '') + '</h5>';
        if(r.failures.length > 0) {
          arrayEach(r.failures, function(f) {
            title += getFailureHTML(f);
            if(f.warning) {
              totalFailed--;
            }

          });
          var warning = arrayEvery(r.failures, function(f){ return f.warning; });
          if(warning) {
            li.addClass('warning');
            li.text('.');
          } else {
            li.addClass('fail');
            li.text('F');
            title += '<p class="fail">Fail (' + commaSeparate(r.assertions) + ' assertions)</p>';
          }
        } else {
          li.text('.');
          li.addClass('pass');
          title += '<p class="pass">Pass (' + commaSeparate(r.assertions) + ' assertions)</p>';
        }

        li.attr('title', '#'+ environment +'_tip_' + totalTests);
        $(document.body).append('<div class="hidden" id="'+ environment +'_tip_' + totalTests + '">' + title + '</div>');
        mod.append(li);
      });
      $(envId + ' .tests').append(mod);
    });

    var stats = $(envId + ' .stats').empty();
    stats.append($('<span class="failures">' + totalFailed + ' ' + (totalFailed == 1 ? 'failure' : 'failures') + '</span>'));
    stats.append($('<span class="tests">' + totalTests + ' ' + (totalTests == 1 ? 'test' : 'tests') + '</span>'));
    stats.append($('<span class="assertions">' + commaSeparate(totalAssertions) + ' ' + (totalAssertions == 1 ? 'assertion' : 'assertions') + '</span>'));
    stats.append($('<span class="runtime">Completed in ' + results[0].time / 1000 + ' seconds</span>'));
    env.addClass('finished');
    if(totalFailed != 0){
      env.addClass('fail');
    }
    $(envId + ' [title]').tooltip({ color: 'black' });
    $(document).trigger('tests_finished', [environment]);
  });


  $(document).bind('suite.started', function(event, environment, modules) {
    var test = findOrCreateTestDiv();
    findOrCreateEnvironmentDiv(environment, test);
  });

  $(document).ready(function() {
    if(typeof startTests == 'function') {
      startTests();
    } else {
      $('.run').click(function(e) {
        var el = $(this);
        var env = el.parents('.environment');
        e.preventDefault();
        el.add($('.tests,.stats', env)).hide();
        $('.loading', env).show();
        try {
          $('iframe#' + el.data('frame'))[0].contentWindow.startTests();
        } catch(e) {
          console.info(e);
        }
      });
    }
  });


  function findOrCreateTestDiv() {
    var div = $('#tests');
    if(div.length == 0) {
      div = $('<div id="tests"/>').appendTo(document.body);
    }
    return div;
  }

  function findOrCreateEnvironmentDiv(name, container) {
    var div = $('#' + name);
    if(div.length == 0) {
      div = $('<div id="'+ name +'"/ class="environment">').appendTo(container);
      $('<h3>' + $('title').text() + '</h3>').appendTo(div);
      $('<div class="loading">Running test.</div>').appendTo(div);
      $('<div class="tests"/>').appendTo(div);
      $('<p><span class="stats"/></p>').appendTo(div);
    }
  }

  function escapeHTML(str) {
    return str ? str.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
  }

  function getFailureHTML(f) {
    var expected, actual, message = escapeHTML(f.message);
    if(f.warning) {
      return '<p class="warning">Warning: ' + message + '</p>';
    } else {
      expected = getStringified(f.expected);
      actual = getStringified(f.actual);
      return '<p class="fail">' + message + ', expected: ' + escapeHTML(expected) + ' actual: ' + escapeHTML(actual) + '</p>';
    }
  };

  function getStringified(p) {
    var str, arr, isArray;
    if(p && p.length > 5000) return 'One BIG ass array of length ' + p.length;
    if(typeof p === 'function') return 'function';
    if(typeof JSON !== 'undefined' && JSON.stringify) {
      try {
        return str = JSON.stringify(p);
      } catch(e) {}
    }
    if(typeof p !== 'object') return String(p);
    isArray = p.join;
    str = isArray ? '[' : '{';
    arr = [];
    for(var key in p){
      if(!p.hasOwnProperty(key)) continue;
      if(p[key] === undefined) {
        arr.push('undefined');
      } else {
        arr.push(p[key]);
      }
    }
    str += arr.join(',');
    str += isArray ? ']' : '}';
    return str;
  };

})(jQuery);
