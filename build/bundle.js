
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Render.svelte generated by Svelte v3.46.2 */
    const file$2 = "src/Render.svelte";

    // (202:12) {:else}
    function create_else_block(ctx) {
    	let svg;
    	let title;
    	let t;
    	let path0;
    	let path1;
    	let polygon0;
    	let polygon1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			title = svg_element("title");
    			t = text("DVD logo");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			polygon0 = svg_element("polygon");
    			polygon1 = svg_element("polygon");
    			add_location(title, file$2, 203, 16, 5201);
    			attr_dev(path0, "d", "M118.895,20.346c0,0-13.743,16.922-13.04,18.001c0.975-1.079-4.934-18.186-4.934-18.186s-1.233-3.597-5.102-15.387H81.81H47.812H22.175l-2.56,11.068h19.299h4.579c12.415,0,19.995,5.132,17.878,14.225c-2.287,9.901-13.123,14.128-24.665,14.128H32.39l5.552-24.208H18.647l-8.192,35.368h27.398c20.612,0,40.166-11.067,43.692-25.288c0.617-2.614,0.53-9.185-1.054-13.053c0-0.093-0.091-0.271-0.178-0.537c-0.087-0.093-0.178-0.722,0.178-0.814c0.172-0.092,0.525,0.271,0.525,0.358c0,0,0.179,0.456,0.351,0.813l17.44,50.315l44.404-51.216l18.761-0.092h4.579c12.424,0,20.09,5.132,17.969,14.225c-2.29,9.901-13.205,14.128-24.75,14.128h-4.405L161,19.987h-19.287l-8.198,35.368h27.398c20.611,0,40.343-11.067,43.604-25.288c3.347-14.225-11.101-25.293-31.89-25.293h-18.143h-22.727C120.923,17.823,118.895,20.346,118.895,20.346L118.895,20.346z");
    			add_location(path0, file$2, 204, 16, 5241);
    			attr_dev(path1, "d", "M99.424,67.329C47.281,67.329,5,73.449,5,81.012c0,7.558,42.281,13.678,94.424,13.678c52.239,0,94.524-6.12,94.524-13.678C193.949,73.449,151.664,67.329,99.424,67.329z M96.078,85.873c-11.98,0-21.58-2.072-21.58-4.595c0-2.523,9.599-4.59,21.58-4.59c11.888,0,21.498,2.066,21.498,4.59C117.576,83.801,107.966,85.873,96.078,85.873z");
    			add_location(path1, file$2, 204, 835, 6060);
    			attr_dev(polygon0, "points", "182.843,94.635 182.843,93.653 177.098,93.653 176.859,94.635 179.251,94.635 178.286,102.226 179.49,102.226 180.445,94.635 182.843,94.635");
    			add_location(polygon0, file$2, 204, 1166, 6391);
    			attr_dev(polygon1, "points", "191.453,102.226 191.453,93.653 190.504,93.653 187.384,99.534 185.968,93.653 185.013,93.653 182.36,102.226 183.337,102.226 185.475,95.617 186.917,102.226 190.276,95.617 190.504,102.226 191.453,102.226");
    			add_location(polygon1, file$2, 204, 1321, 6546);
    			attr_dev(svg, "id", "dvd_logo");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", "100%");
    			attr_dev(svg, "viewBox", "0 0 210 107");
    			attr_dev(svg, "class", "svelte-1yfadgo");
    			add_location(svg, file$2, 202, 12, 5060);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, title);
    			append_dev(title, t);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, polygon0);
    			append_dev(svg, polygon1);
    			/*svg_binding*/ ctx[18](svg);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			/*svg_binding*/ ctx[18](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(202:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (200:12) {#if image_src}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*image_src*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Custom Logo Sent by User");
    			add_location(img, file$2, 200, 16, 4955);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			/*img_binding*/ ctx[17](img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*image_src*/ 2 && !src_url_equal(img.src, img_src_value = /*image_src*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			/*img_binding*/ ctx[17](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(200:12) {#if image_src}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div0;
    	let span0;
    	let t1;
    	let input;
    	let t2;
    	let br0;
    	let t3;
    	let span1;
    	let t4;
    	let t5;
    	let t6;
    	let button0;
    	let t8;
    	let button1;
    	let t10;
    	let br1;
    	let t11;
    	let span2;
    	let t12;
    	let t13;
    	let t14;
    	let t15;
    	let button2;
    	let t17;
    	let button3;
    	let t19;
    	let br2;
    	let t20;
    	let button4;
    	let div0_class_value;
    	let t22;
    	let div2;
    	let div1;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*image_src*/ ctx[1]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Set Your Own Logo:";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			br0 = element("br");
    			t3 = space();
    			span1 = element("span");
    			t4 = text("Speed: ");
    			t5 = text(/*speed*/ ctx[5]);
    			t6 = space();
    			button0 = element("button");
    			button0.textContent = "Faster";
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "Slower";
    			t10 = space();
    			br1 = element("br");
    			t11 = space();
    			span2 = element("span");
    			t12 = text("Size: ");
    			t13 = text(/*size*/ ctx[8]);
    			t14 = text("px");
    			t15 = space();
    			button2 = element("button");
    			button2.textContent = "Bigger";
    			t17 = space();
    			button3 = element("button");
    			button3.textContent = "Smaller";
    			t19 = space();
    			br2 = element("br");
    			t20 = space();
    			button4 = element("button");
    			button4.textContent = "Toogle Fullscreen";
    			t22 = space();
    			div2 = element("div");
    			div1 = element("div");
    			if_block.c();
    			set_style(span0, "font-weight", "bolder");
    			add_location(span0, file$2, 154, 8, 3477);
    			attr_dev(input, "type", "file");
    			attr_dev(input, "accept", "image/*");
    			add_location(input, file$2, 155, 8, 3546);
    			add_location(br0, file$2, 159, 8, 3713);
    			add_location(span1, file$2, 161, 8, 3728);
    			add_location(button0, file$2, 162, 8, 3764);
    			add_location(button1, file$2, 165, 8, 3843);
    			add_location(br1, file$2, 168, 8, 3922);
    			add_location(span2, file$2, 170, 8, 3937);
    			add_location(button2, file$2, 171, 8, 3973);
    			add_location(button3, file$2, 174, 8, 4060);
    			add_location(br2, file$2, 177, 8, 4148);
    			add_location(button4, file$2, 179, 8, 4171);
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*isFullscreen*/ ctx[4] ? "isFull" : undefined) + " svelte-1yfadgo"));
    			add_location(div0, file$2, 153, 4, 3421);
    			attr_dev(div1, "id", "dvd");
    			attr_dev(div1, "class", "svelte-1yfadgo");
    			add_location(div1, file$2, 198, 8, 4880);
    			attr_dev(div2, "id", "renderBox");
    			attr_dev(div2, "class", "svelte-1yfadgo");
    			add_location(div2, file$2, 197, 4, 4829);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			append_dev(div0, t2);
    			append_dev(div0, br0);
    			append_dev(div0, t3);
    			append_dev(div0, span1);
    			append_dev(span1, t4);
    			append_dev(span1, t5);
    			append_dev(div0, t6);
    			append_dev(div0, button0);
    			append_dev(div0, t8);
    			append_dev(div0, button1);
    			append_dev(div0, t10);
    			append_dev(div0, br1);
    			append_dev(div0, t11);
    			append_dev(div0, span2);
    			append_dev(span2, t12);
    			append_dev(span2, t13);
    			append_dev(span2, t14);
    			append_dev(div0, t15);
    			append_dev(div0, button2);
    			append_dev(div0, t17);
    			append_dev(div0, button3);
    			append_dev(div0, t19);
    			append_dev(div0, br2);
    			append_dev(div0, t20);
    			append_dev(div0, button4);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			if_block.m(div1, null);
    			/*div1_binding*/ ctx[19](div1);
    			/*div2_binding*/ ctx[20](div2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[10]),
    					listen_dev(input, "change", /*change_handler*/ ctx[11], false, false, false),
    					listen_dev(button0, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[13], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[14], false, false, false),
    					listen_dev(button3, "click", /*click_handler_3*/ ctx[15], false, false, false),
    					listen_dev(button4, "click", /*click_handler_4*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*speed*/ 32) set_data_dev(t5, /*speed*/ ctx[5]);
    			if (dirty[0] & /*size*/ 256) set_data_dev(t13, /*size*/ ctx[8]);

    			if (dirty[0] & /*isFullscreen*/ 16 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*isFullscreen*/ ctx[4] ? "isFull" : undefined) + " svelte-1yfadgo"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(div2);
    			if_block.d();
    			/*div1_binding*/ ctx[19](null);
    			/*div2_binding*/ ctx[20](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Render', slots, []);
    	let files;
    	let image_src = '';
    	let dvd_logo = '';
    	let image = '';

    	//List of colors to iterate when collision occurs
    	const colorList = [
    		"blue",
    		"red",
    		"green",
    		"violet",
    		"white",
    		"purple",
    		"yellow",
    		"cyan",
    		"teal",
    		"orange"
    	];

    	let isFullscreen = false;
    	let updateInterval = 10;
    	let speed = 4;
    	let currentColor = getRandomColor();
    	let y = 1;
    	let x = 1;
    	let padding = 8;
    	let directionY = true;
    	let directionX = true;
    	let boundX = 0;
    	let boundY = 0;
    	let renderBox = '';
    	let dvd = '';
    	let size = 150;
    	let imageLoaded = false;

    	onMount(() => {
    		//Setting up render event
    		setInterval(
    			() => {
    				//Update image size whenever changed.
    				if (!image_src) {
    					$$invalidate(7, dvd.style.width = `${size}px`, dvd);
    				}

    				if (image_src) {
    					$$invalidate(3, image.style.width = `${size}px`, image);
    				}

    				//If the user sends an image of his own, convert it and render.
    				if (files && !imageLoaded) {
    					blobToImage();
    					$$invalidate(7, dvd.style.background = "RGBA(0,0,0,0)", dvd);
    					$$invalidate(7, dvd.style.height = 'unset', dvd);
    					$$invalidate(7, dvd.style.width = 'unset', dvd);
    					$$invalidate(9, imageLoaded = true);
    				}

    				render();
    			},
    			updateInterval
    		);
    	});

    	function render() {
    		//Setting up bounds for collision.
    		boundX = renderBox.offsetWidth - dvd.offsetWidth - padding;

    		boundY = renderBox.offsetHeight - dvd.offsetHeight - padding;

    		//Colliding on Y axis.
    		if (y >= boundY && directionY) {
    			onCollide("Y");
    		} else if (y < padding && !directionY) {
    			onCollide("Y");
    		}

    		//Colliding on X axis.
    		if (x >= boundX && directionX) {
    			onCollide("X");
    		} else if (x < padding && !directionX) {
    			onCollide("X");
    		}

    		//Setting up the speed and direction of X axis
    		if (directionX) {
    			x = x + 1 * speed;
    		} else {
    			x = x + 1 * speed * -1;
    		}

    		//Setting up the speed and direction of Y axis
    		if (directionY) {
    			y = y + 1 * speed;
    		} else {
    			y = y + 1 * speed * -1;
    		}

    		//Setting up logo position on the axis
    		$$invalidate(7, dvd.style.left = `${x}px`, dvd);

    		$$invalidate(7, dvd.style.top = `${y}px`, dvd);
    	}

    	//Change direction whenever the box collide
    	function onCollide(axis) {
    		switch (axis) {
    			case "Y":
    				directionY = !directionY;
    				break;
    			case "X":
    				directionX = !directionX;
    				break;
    		}

    		currentColor = getRandomColor();
    		$$invalidate(2, dvd_logo.style.fill = currentColor, dvd_logo);
    	}

    	function getRandomColor() {
    		return colorList[(Math.random() * 10 - 1).toFixed(0)];
    	}

    	//Convert blob sent by user to base64image on the fly.
    	function blobToImage() {
    		return new Promise(resolve => {
    				const url = URL.createObjectURL(files);
    				let img = new Image();

    				img.onload = () => {
    					URL.revokeObjectURL(url);
    					resolve(img);
    				};

    				$$invalidate(1, image_src = url);
    			});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Render> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		files = this.files;
    		$$invalidate(0, files);
    	}

    	const change_handler = event => {
    		$$invalidate(0, files = event.target.files[0]);
    		$$invalidate(9, imageLoaded = false);
    	};

    	const click_handler = () => $$invalidate(5, speed++, speed);
    	const click_handler_1 = () => $$invalidate(5, speed--, speed);
    	const click_handler_2 = () => $$invalidate(8, size = size + 5);
    	const click_handler_3 = () => $$invalidate(8, size = size - 5);

    	const click_handler_4 = () => {
    		$$invalidate(4, isFullscreen = !isFullscreen);

    		if (isFullscreen) {
    			$$invalidate(6, renderBox.style.position = "absolute", renderBox);
    			$$invalidate(6, renderBox.style.top = 0, renderBox);
    			$$invalidate(6, renderBox.style.left = 0, renderBox);
    			$$invalidate(6, renderBox.style.marginBottom = 0, renderBox);
    			document.getElementsByTagName("body")[0].style.overflow = "hidden";
    		} else {
    			$$invalidate(6, renderBox.style.position = "relative", renderBox);
    			document.getElementsByTagName("body")[0].style.overflow = "unset";
    		}
    	};

    	function img_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			image = $$value;
    			$$invalidate(3, image);
    		});
    	}

    	function svg_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			dvd_logo = $$value;
    			$$invalidate(2, dvd_logo);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			dvd = $$value;
    			$$invalidate(7, dvd);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			renderBox = $$value;
    			$$invalidate(6, renderBox);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		files,
    		image_src,
    		dvd_logo,
    		image,
    		colorList,
    		isFullscreen,
    		updateInterval,
    		speed,
    		currentColor,
    		y,
    		x,
    		padding,
    		directionY,
    		directionX,
    		boundX,
    		boundY,
    		renderBox,
    		dvd,
    		size,
    		imageLoaded,
    		render,
    		onCollide,
    		getRandomColor,
    		blobToImage
    	});

    	$$self.$inject_state = $$props => {
    		if ('files' in $$props) $$invalidate(0, files = $$props.files);
    		if ('image_src' in $$props) $$invalidate(1, image_src = $$props.image_src);
    		if ('dvd_logo' in $$props) $$invalidate(2, dvd_logo = $$props.dvd_logo);
    		if ('image' in $$props) $$invalidate(3, image = $$props.image);
    		if ('isFullscreen' in $$props) $$invalidate(4, isFullscreen = $$props.isFullscreen);
    		if ('updateInterval' in $$props) updateInterval = $$props.updateInterval;
    		if ('speed' in $$props) $$invalidate(5, speed = $$props.speed);
    		if ('currentColor' in $$props) currentColor = $$props.currentColor;
    		if ('y' in $$props) y = $$props.y;
    		if ('x' in $$props) x = $$props.x;
    		if ('padding' in $$props) padding = $$props.padding;
    		if ('directionY' in $$props) directionY = $$props.directionY;
    		if ('directionX' in $$props) directionX = $$props.directionX;
    		if ('boundX' in $$props) boundX = $$props.boundX;
    		if ('boundY' in $$props) boundY = $$props.boundY;
    		if ('renderBox' in $$props) $$invalidate(6, renderBox = $$props.renderBox);
    		if ('dvd' in $$props) $$invalidate(7, dvd = $$props.dvd);
    		if ('size' in $$props) $$invalidate(8, size = $$props.size);
    		if ('imageLoaded' in $$props) $$invalidate(9, imageLoaded = $$props.imageLoaded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		files,
    		image_src,
    		dvd_logo,
    		image,
    		isFullscreen,
    		speed,
    		renderBox,
    		dvd,
    		size,
    		imageLoaded,
    		input_change_handler,
    		change_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		img_binding,
    		svg_binding,
    		div1_binding,
    		div2_binding
    	];
    }

    class Render extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Render",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Footer.svelte generated by Svelte v3.46.2 */

    const file$1 = "src/Footer.svelte";

    function create_fragment$1(ctx) {
    	let a;
    	let div;
    	let span0;
    	let svg;
    	let path;
    	let t0;
    	let span2;
    	let t1;
    	let span1;
    	let t3;

    	const block = {
    		c: function create() {
    			a = element("a");
    			div = element("div");
    			span0 = element("span");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			span2 = element("span");
    			t1 = text("Made with ");
    			span1 = element("span");
    			span1.textContent = "❤️";
    			t3 = text(" by Jorge");
    			attr_dev(path, "fill", "currentColor");
    			attr_dev(path, "d", "M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z");
    			add_location(path, file$1, 4, 186, 353);
    			attr_dev(svg, "width", "18px");
    			attr_dev(svg, "height", "18px");
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "data-prefix", "fab");
    			attr_dev(svg, "data-icon", "github");
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 496 512");
    			add_location(svg, file$1, 4, 12, 179);
    			add_location(span0, file$1, 3, 8, 160);
    			attr_dev(span1, "role", "img");
    			attr_dev(span1, "aria-label", "heart emoji");
    			add_location(span1, file$1, 5, 32, 1734);
    			add_location(span2, file$1, 5, 16, 1718);
    			attr_dev(div, "class", "github-link-container svelte-vasjp3");
    			add_location(div, file$1, 2, 4, 116);
    			attr_dev(a, "class", "github-link svelte-vasjp3");
    			attr_dev(a, "href", "https://github.com/Jorgen-Jr/dvd-logo");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener noreferrer");
    			add_location(a, file$1, 1, 0, 1);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, div);
    			append_dev(div, span0);
    			append_dev(span0, svg);
    			append_dev(svg, path);
    			append_dev(div, t0);
    			append_dev(div, span2);
    			append_dev(span2, t1);
    			append_dev(span2, span1);
    			append_dev(span2, t3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let t1;
    	let render;
    	let t2;
    	let footer;
    	let current;
    	render = new Render({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = space();
    			create_component(render.$$.fragment);
    			t2 = space();
    			create_component(footer.$$.fragment);
    			add_location(h1, file, 8, 1, 125);
    			attr_dev(main, "class", "svelte-mkmixa");
    			add_location(main, file, 7, 0, 117);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(main, t1);
    			mount_component(render, main, null);
    			append_dev(main, t2);
    			mount_component(footer, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(render.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(render.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(render);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ Render, Footer, name });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'DVD Logo'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
