(function() {

    var apiDescription = null;
    var currentId = 0;
    var descCache = {};

    function nextId(desc) {
        currentId++;

        desc.id = currentId.toString();
        descCache[desc.id] = desc;
    }

    function getComplexType(desc) {
        var typeName = desc.TypeName || desc.ValueTypeName;

        var found = apiDescription.ComplexTypes.filter(function(t) {
            return t.Name == typeName;
        });

        if (found.length) {
            return found[0];
        }
        return null;
    }

    function clone(thing) {
        return JSON.parse(JSON.stringify(thing));
    }

    //the name of the api is the last segment of the url. 
    var apiId = window.location.pathname.split('/').pop();

    //go get the meta data for this API
    getJson("/WebApiTestClient.axd?ApiName=" + apiId, getReadyToUseTestClient);


    //callback from getting meta data.
    function getReadyToUseTestClient(data) {
        apiDescription = data;
        setUpApiDescForUi();
        console.dir(apiDescription);
        dom.el("link", {"href": "/Content/WebApiTestClient/styles.css","rel":"stylesheet","type": "text/css"}, document.head);
        dom.el("script", { "src": "//cdnjs.cloudflare.com/ajax/libs/handlebars.js/2.0.0/handlebars.min.js", "type": "text/javascript" }, document.head);
        makeActivatorButton();
    }

    //take the metadata and extend the objects a bit to help out with the handlebars templates
    function setUpApiDescForUi() {
        apiDescription.QueryParameters.forEach(function(p) {
            nextId(p);
        });
        apiDescription.RouteParameters.forEach(function(p) {
            nextId(p);
        });

        if (apiDescription.BodyParameter) {
            setUpProperties(apiDescription.BodyParameter);
        }
    }


    function setUpProperties(desc) {
        if (!desc.id) {
            nextId(desc);
        }
            
        var ct = getComplexType(desc);

        
        if (ct) {
            if (desc.IsList) {
                desc.Items = [];
            } else {
                desc.Properties = clone(ct.Properties);
                desc.Properties.forEach(function(p) {
                    nextId(p);
                });
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


        dom.gid('watc-panel').addEventListener("click", clickHandler);
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
            var id = el.getAttribute("data-id");
            var container = dom.gid('input-list-' + id);
            var inputs = dom.childs(container, 'span');
            if (inputs.length) {
                container.removeChild(inputs[inputs.length - 1]);
            }
        },

        inputListAdd:function(el) {
            var id = el.getAttribute("data-id");
            var desc = descCache[id];
            var html = templates['simple-input'](desc);

            var container = dom.gid('input-list-' + id);

            dom.html(html, container);

        },

        complexListAdd:function(el) {
            var typeName = el.getAttribute("data-type-name");
            var id = el.getAttribute("data-id");

        },

        complexListRemove: function (el) {


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

        complexObjectSetValue: function (el) {

            var id = el.getAttribute("data-id");
            var typeName = el.getAttribute("data-type-name");


            var prop = descCache[id];

            setUpProperties(prop);


            var toReplace = dom.gid('property-' + id);
            toReplace.removeAttribute('id');

            var container = toReplace.parentNode;

            var html = templates['named-property'](prop);
            dom.html(html, container, toReplace);
            container.removeChild(toReplace);


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