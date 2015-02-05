(function() {

    var apiDescription = null;
    var apiViewContext = null;

    //the name of the api is the last segment of the url. 
    var apiId = window.location.pathname.split('/').pop();

    //go get the meta data for this API
    getJson("/WebApiTestClient.axd?ApiName=" + apiId, getReadyToUseTestClient);


    //callback from getting meta data.
    function getReadyToUseTestClient(data) {
        apiDescription = data;
        apiViewContext = JSON.parse(JSON.stringify(apiDescription));

        console.dir(apiViewContext);
        dom.el("link", {"href": "/Content/WebApiTestClient/styles.css","rel":"stylesheet","type": "text/css"}, document.head);
        dom.el("script", { "src": "/Content/WebApiTestClient/views.jsx", "type": "text/jsx" }, document.head);
        dom.el("script", { "src": "//cdnjs.cloudflare.com/ajax/libs/react/0.12.2/react.js", "type": "text/javascript" }, document.head);
        dom.el("script", { "src": "//cdnjs.cloudflare.com/ajax/libs/react/0.12.2/JSXTransformer.js", "type": "text/javascript" }, document.head);
        makeActivatorButton();


    }


    //put the button on the screen that the user will click to activate the test client.
    function makeActivatorButton() {
        var a = dom.el("A", {'class':"watc-activator","href": "#test"}, document.body);

        dom.text(a, "Test this API");

        a.addEventListener("click", function (ev) {
            ev.preventDefault();
            getTemplate(showUi);
            a.parentNode.removeChild(a);
            console.log("show the ui");

        });

    }


    function showUi(jsx) {

        var transformed = JSXTransformer.exec(jsx);
        
        React.render(WatcPanel, dom.el('div', null, document.body));

    }


    //dom manipulation utilities
    var dom = {
        //get an element by ID
        gid: function(id) {
            return document.getElementById(id);
        },

        //add text to an element
        text: function (el, text) {
            el = typeof(el) == "string" ? this.gid(el) : el;
            el.appendChild(document.createTextNode(text));
        },

        //create an element
        el: function(nodeType, attrs, parent) {
            var el = document.createElement(nodeType);
            if (attrs) {
                for (var attr in attrs) {
                    el.setAttribute(attr, attrs[attr]);
                }
            }
            if (parent) {
                parent.appendChild(el);
            }
            return el;
        },

        //append html to an element or insert it before
        html:function(html, parent, insertPoint) {
            var d = this.el('div');
            d.innerHTML = html;
            while (d.firstChild) {
                if (insertPoint) {
                    parent.insertBefore(d.firstChild, insertPoint);
                } else {
                    parent.appendChild(d.firstChild);
                }
            }
        },
        //get the previous sibling of a node that is a specific node name
        prevSib:function(node, nodeName) {

            var found = node.previousSibling;
            while (found != null && found.nodeName.toLowerCase() != nodeName) {
                found = found.previousSibling;
            }
            return found;

        },

        //get the child nodes of a node or optionally by a specific node name
        childs: function (node, nodeName) {

            var childs = [].filter.call(node.childNodes, function (n) {
                return !nodeName || n.nodeName.toLowerCase() == nodeName.toLowerCase();
            });

            return childs;
        }
    }


    //ajax to get a json object form the server
    function getJson(url, callback) {

        var xhr = new XMLHttpRequest();

        xhr.onload = function () {

            if (xhr.status == 200) {
                var data = JSON.parse(xhr.response);

                callback(data);
            } else {
                console.log("AJAX ERROR getJson");
                console.dir(xhr);
            }

        }

        xhr.open("GET", url);
        xhr.send();
    }

    //ajax to get the template html
    function getTemplate(callback) {

        var xhr = new XMLHttpRequest();

        xhr.onload = function () {

            if (xhr.status == 200) {

                callback(xhr.response);

            } else {
                console.log("AJAX ERROR getTemplate");
                console.dir(xhr);
            }

        }

        xhr.open("GET", "/Content/WebApiTestClient/views.jsx");
        xhr.send();
    }

})();