var inkApp = angular.module('inkApp', []);

inkApp.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
        when('/home', {
            templateUrl: 'views/home.html',
            controller: 'HomeController'
        }).
        when('/discover', {
            templateUrl: 'views/discover.html',
            controller: 'DiscoverController'
        }).
        when('/create', {
            templateUrl: 'views/create.html',
            controller: 'CreateController'
        }).
        otherwise({
            redirectTo: '/home'
        });
    }]);

inkApp.directive('script', function() {
    return {
        restrict: 'E',
        scope: false,
        link: function(scope, elem, attr) {
            if (attr.type === 'text/javascript-lazy') {
                var code = elem.text();
                var f = new Function(code);
                f();
            }
        }
    };
});

inkApp.controller('HomeController', function($scope) {

    $scope.message = 'Home Screen';

});


inkApp.controller('DiscoverController', function($scope) {

    $scope.message = 'This is Show orders screen';

});

inkApp.controller('CreateController', function($scope) {

    $scope.message = 'This is Show orders screen';

});