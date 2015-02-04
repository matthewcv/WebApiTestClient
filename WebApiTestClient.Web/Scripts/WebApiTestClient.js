(function() {

    var apiDescription = null;

    //the name of the api is the last segment of the url. 
    var apiId = window.location.pathname.split('/').pop();

    //go get the meta data for this API
    getJson("/WebApiTestClient.axd?ApiName=" + apiId, getReadyToUseTestClient);


    //callback from getting meta data.
    function getReadyToUseTestClient(data) {
        apiDescription = data;
        setUpApiDescForUi();
        console.dir(data);
        dom.el("link", {"href": "/Content/WebApiTestClient/styles.css","rel":"stylesheet","type": "text/css"}, document.head);
        dom.el("script", { "src": "//cdnjs.cloudflare.com/ajax/libs/handlebars.js/2.0.0/handlebars.min.js", "type": "text/javascript" }, document.head);
        makeActivatorButton();


    }

    //take the metadata and extend the objects a bit to help out with the handlebars templates
    function setUpApiDescForUi() {
        apiDescription.QueryParameters.forEach(function(p) {
            p.id = "$qp." + p.Name;
        });
        apiDescription.RouteParameters.forEach(function(p) {
            p.id = "$rp." + p.Name;
        });

        if (apiDescription.BodyParameter) {
            apiDescription.BodyParameter.id = apiDescription.BodyParameter.Name;
            if (apiDescription.BodyParameter.IsList || apiDescription.BodyParameter.IsDictionary) {
                apiDescription.BodyParameter.id = apiDescription.BodyParameter.id + "[0]";
            }

        }
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


    //callback from the ajax call that gets the template HTML
    function showUi() {
        configHandlebars();

        var html = templates['container'](apiDescription);
        dom.html(html, document.body);

        if (apiDescription.BodyParameter && !apiDescription.BodyParameter.IsSimple) {
            addProperties(apiDescription.BodyParameter.id,apiDescription.BodyParameter.TypeName);
        }

        dom.gid('watc-panel').addEventListener("click", clickHandler);
    }

    //invoke the template that builds out the ui for the properties of a complex object then insert the resultant HTML into the dom at the appropriate palce
    function addProperties(id, typeName) {
        if (typeName) {
            var type = apiDescription.ComplexTypes.filter(function(t) {
                return t.Name == typeName;
            });
            if (type.length) {
                type = type[0];

                type.Properties.forEach(function(p) {
                    p.id = id + "." + p.Name;
                    if (p.IsList) {
                        p.id = p.id + '[0]';
                    }
                })

                var html = templates['complex-type-properties'](type);

                dom.html(html, dom.gid(id + '.properties'));
            }
        }
    }

    //handles any click event from within the panel that contains the test client
    function clickHandler(ev) {
        var cmd = ev.target.getAttribute("data-cmd");
        if (cmd && commands[cmd]) {
            ev.preventDefault();
            commands[cmd](ev.target);
        }
    }

    //set up handlebars.  
    function configHandlebars() {

        //Get all the templates, compile each one, cache the compiled template and register it as a partial
        [].forEach.call(document.querySelectorAll("script[type='text/html']"), function(t) {

            var name = t.getAttribute("id").replace("tpl-watc-", "");

            templates[name] = Handlebars.compile(t.innerHTML);
            Handlebars.registerPartial(name, templates[name]);
        });

    }


    var templates = {};

    //commands that respond to various buttons that could be clicked by the user.  functions correspond to data-cmd attribute values in links and buttons in the templates.  
    var commands = {

        inputListRemove:function(el) {
            var inputs = el.parentNode.querySelectorAll("input");
            if (inputs.length == 1) {
                return;
            }
            var last = inputs[inputs.length - 1];

            el.parentNode.removeChild(last.previousSibling);

            el.parentNode.removeChild(last);
        },

        inputListAdd:function(el) {
            var inputs = el.parentNode.querySelectorAll("input");
            var insertPoint = inputs[inputs.length - 1].nextSibling;
            var newInput = inputs[inputs.length - 1].cloneNode();
            newInput.value = null;

            el.parentNode.insertBefore(document.createTextNode(", "), insertPoint);
            el.parentNode.insertBefore(newInput, insertPoint);
        },

        complexListAdd:function(el) {
            var typeName = el.getAttribute("data-type-name");
            var id = el.getAttribute("data-id");
            //id will have [0] at end.  Need to get the last div so that the new one can have the next index.
            var divs = [].filter.call(el.parentNode.childNodes, function(n) {
                return n.nodeName.toLowerCase() == 'div';
            });
            var last;
            if (divs.length) {
                last = divs[divs.length - 1];
            }

            var idx = last == null ? 0 : divs.length;
            var newId = id.substring(0, id.lastIndexOf("[")) + "[" + idx + "]";

            var html = templates["complex-type"]({ id: newId });
            if (idx > 0) {
                html = "<span class='comma'>, </span>" + html;
            }
            var insertPoint = last == null ? el.parentNode.firstChild : last.nextSibling;

            dom.html(html, el.parentNode, insertPoint);

            addProperties(newId, typeName);
            //these are the existing objects.
        },

        complexListRemove: function (el) {
            var divs = dom.childs(el.parentNode, "div");

            if (divs.length ) {
                var last = divs[divs.length - 1];
                
                while (last.previousSibling && last.previousSibling.nodeName.toLowerCase() != "div") {
                    last.parentNode.removeChild(last.previousSibling);
                }

                last.parentNode.removeChild(last);
            }

        },

        dictionaryRemove:function(el) {
            var theUl = dom.prevSib(el, 'ul');
            var last = theUl.lastChild;
            if (last.nodeName.toLowerCase() != 'li') {
                last = dom.prevSib(last, 'li');
            }

            var prev = dom.prevSib(last, 'li');

            console.dir(prev);
            if (prev && prev.lastChild.nodeName.toLowerCase() == "#text") {
                prev.removeChild(prev.lastChild);
            }

            theUl.removeChild(last);
        },

        dictionaryAdd: function (el) {
            var id = el.getAttribute("data-id");

            console.log(id);

            var typeName = el.getAttribute("data-type-name");

            var type = apiDescription.ComplexTypes.filter(function (t) {
                return t.Name == typeName;
            });

            var lis = dom.childs(dom.prevSib(el,'ul'), "li");

            id = id.substring(0, id.lastIndexOf("[")) + "[" + lis.length + "]";

            var context = { id: id, IsSimple: type.length==0, ValueTypeName:typeName }
            var html = templates['dictionary-type-item'](context).trim();

            var theUl = dom.prevSib(el, 'ul');

            dom.html(html, theUl);

            var prevLi = dom.prevSib(theUl.lastChild, "li");
            if (prevLi) {
                prevLi.appendChild(document.createTextNode(","));
            }
        },

        innerComplexPropery:function(el) {

            var id = el.getAttribute("data-id");
            var typeName = el.getAttribute("data-type-name");

            addProperties(id, typeName);

            el.parentElement.removeChild(el);

        }
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

    //ajax to get the template html
    function getTemplate(callback) {

        var xhr = new XMLHttpRequest();

        xhr.onload = function () {

            if (xhr.status == 200) {

                var templates = document.createElement("DIV");
                templates.innerHTML = xhr.response;
                document.body.appendChild(templates);
                callback();

            } else {
                console.log("AJAX ERROR getTemplate");
                console.dir(xhr);
            }

        }

        xhr.open("GET", "/Content/WebApiTestClient/views.html");
        xhr.send();
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


})();