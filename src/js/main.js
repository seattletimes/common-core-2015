// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("angular/angular.min");

var total = window.ccData;
var app = angular.module("common-core-search", []);

var scoreFields = "MathPercentMetStandardExcludingNoScore SciencePercentMetStandardExcludingNoScore WritingPercentMetStandardExcludingNoScore".split(" ");

var groupedResults = {};
ccData.forEach(function(a) {
  if(!groupedResults[a.district]) groupedResults[a.district] = {
    county: a.county,
    district: a.district
  };
  var group = groupedResults[a.district];
  var hasResult = false;
  scoreFields.forEach(f => hasResult = hasResult || !!a[f]);
  if (!hasResult) return;
  if (!group.grades) group.grades = {};
  group.grades[a.GradeTested] = a;
});
var grouped = Object.keys(groupedResults).map(k => groupedResults[k]);

app.controller("commonCoreController", ["$scope", function($scope) {
  $scope.ccData = ccData;
  var all = ccData;

  $scope.districts = grouped;
  $scope.selected = all;

  //update selected from the district dropdown
  $scope.$watch(function() {
    var district = $scope.selected = all[$scope.district];
    var available = d => !d.exclude && district[`${d.data}_d`] && district[`${d.data}_d`] !== "N/A";
  });

}]);

app.directive("typeSelect", function() {
  return {
    template: `
<input ng-model="selection" placeholder="Enter district or county">
<div class="completion">
  <div class="options">
    <a class="option" ng-repeat="option in filtered" ng-click="setValue(option)">
      {{option.district}} ({{option.county}})
    </a>
  </div>
  <div class="nothing" ng-if="filtered.length == 0">
    <i class="fa fa-search"></i> No results found.
  </div>
</div>
    `,
    restrict: "E",
    scope: {
      options: "=",
      model: "="
    },
    link: function(scope, element, attr) {
      var el = element[0];
      var input = el.querySelector("input");
      var cachedValue;
      var setValue = true;

      input.addEventListener("focus", function() {
        cachedValue = input.value;
        input.value = "";
        element.addClass("show-completion");
        scope.filtered = scope.options;
        setValue = false;
        scope.$apply();
      });

      // closes the drow-down menu after user clicks on something
      input.addEventListener("blur", function() {
        setTimeout(() => element.removeClass("show-completion"), 300);
        if (!input.value || !setValue) input.value = cachedValue;
      });

      input.addEventListener("keyup", function(e) {
        if (!input.value) {
          scope.filtered = scope.options;
          return;
        }
        var regex = new RegExp(input.value, "i");
        scope.filtered = scope.options.filter(d => d.district.match(regex) || d.county.match(regex));
        if (e.keyCode == 13) {
          input.blur();
          scope.setValue(scope.filtered[0]);
        }
        // scope.filtered = scope.filtered.slice(0, 10);
        scope.$apply();
      });

      scope.$watch("model", function() {
        var option = scope.options.filter(o => o == scope.model);
        option = option.pop();
        var label;
        if (!option) {
          // label = "Seattle Public Schools (King)";
          label = "Enter district or county"
        } else {
          label = `${option.district} (${option.county})`;
        }
        input.value = label;
      });

      scope.setValue = function(option) {
        setValue = true;
        console.log("set", option);
        if (!option.district) return;
        input.value = `${option.district} (${option.county})`;
        scope.model = option;
      }
    }
  }
});
