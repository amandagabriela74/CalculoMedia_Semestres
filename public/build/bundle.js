
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    // o estado do jogo guarda a informação sobre a tela questamos no momento
    let estado = writable('menu');

    function trocarEstadoDoJogo(novoEstado) {
    	estado.set(novoEstado);
    }

    /* src\Menu.svelte generated by Svelte v3.44.3 */
    const file$3 = "src\\Menu.svelte";

    function create_fragment$4(ctx) {
    	let link;
    	let t0;
    	let h1;
    	let t2;
    	let br0;
    	let br1;
    	let t3;
    	let div0;
    	let t5;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Média Final";
    			t2 = space();
    			br0 = element("br");
    			br1 = element("br");
    			t3 = space();
    			div0 = element("div");
    			div0.textContent = "Calcular a Média";
    			t5 = space();
    			div1 = element("div");
    			div1.textContent = "Sobre";
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "/styles/menu.css");
    			add_location(link, file$3, 1, 1, 16);
    			add_location(h1, file$3, 9, 0, 196);
    			add_location(br0, file$3, 13, 0, 225);
    			add_location(br1, file$3, 13, 4, 229);
    			attr_dev(div0, "class", "menu");
    			add_location(div0, file$3, 15, 0, 237);
    			attr_dev(div1, "class", "menu");
    			add_location(div1, file$3, 19, 0, 331);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[0], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Menu', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => trocarEstadoDoJogo('media');
    	const click_handler_1 = () => trocarEstadoDoJogo('sobre');
    	$$self.$capture_state = () => ({ estado, trocarEstadoDoJogo });
    	return [click_handler, click_handler_1];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\VoltarMenu.svelte generated by Svelte v3.44.3 */
    const file$2 = "src\\VoltarMenu.svelte";

    function create_fragment$3(ctx) {
    	let link;
    	let t0;
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			div = element("div");
    			div.textContent = "Voltar ao menu";
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "/styles/menu.css");
    			add_location(link, file$2, 1, 1, 16);
    			attr_dev(div, "class", "menu");
    			add_location(div, file$2, 8, 0, 157);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('VoltarMenu', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<VoltarMenu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => trocarEstadoDoJogo('menu');
    	$$self.$capture_state = () => ({ trocarEstadoDoJogo });
    	return [click_handler];
    }

    class VoltarMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VoltarMenu",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Media.svelte generated by Svelte v3.44.3 */
    const file$1 = "src\\Media.svelte";

    function create_fragment$2(ctx) {
    	let body;
    	let div2;
    	let h1;
    	let t1;
    	let for_1;
    	let div0;
    	let p0;
    	let b;
    	let t3;
    	let input0;
    	let t4;
    	let label0;
    	let h30;
    	let t6;
    	let p1;
    	let t8;
    	let input1;
    	let t9;
    	let input2;
    	let t10;
    	let label1;
    	let h31;
    	let t12;
    	let p2;
    	let t14;
    	let input3;
    	let t15;
    	let input4;
    	let t16;
    	let div1;
    	let button;
    	let t18;
    	let h2;
    	let t19;
    	let t20;
    	let t21;
    	let t22;
    	let voltarmenu;
    	let current;
    	let mounted;
    	let dispose;
    	voltarmenu = new VoltarMenu({ $$inline: true });

    	const block = {
    		c: function create() {
    			body = element("body");
    			div2 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Média Final";
    			t1 = space();
    			for_1 = element("for");
    			div0 = element("div");
    			p0 = element("p");
    			b = element("b");
    			b.textContent = "Qual seu nome?";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label0 = element("label");
    			h30 = element("h3");
    			h30.textContent = "SEMESTRE I";
    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "Digite notas notas da I e II unidade respectivamentes";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			label1 = element("label");
    			h31 = element("h3");
    			h31.textContent = "SEMESTRE II";
    			t12 = space();
    			p2 = element("p");
    			p2.textContent = "Digite notas notas da I e II unidade respectivamentes";
    			t14 = space();
    			input3 = element("input");
    			t15 = space();
    			input4 = element("input");
    			t16 = space();
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "Resultado";
    			t18 = space();
    			h2 = element("h2");
    			t19 = text(/*nome*/ ctx[0]);
    			t20 = text(" Sua média final é: ");
    			t21 = text(/*media*/ ctx[2]);
    			t22 = space();
    			create_component(voltarmenu.$$.fragment);
    			add_location(h1, file$1, 24, 3, 427);
    			add_location(b, file$1, 27, 15, 494);
    			add_location(p0, file$1, 27, 12, 491);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "nome");
    			attr_dev(input0, "placeholder", "Ex: Amanda Gabriela..");
    			add_location(input0, file$1, 28, 12, 533);
    			add_location(div0, file$1, 26, 10, 472);
    			add_location(h30, file$1, 31, 8, 662);
    			add_location(p1, file$1, 32, 8, 691);
    			attr_dev(input1, "name", "nota01");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "id", "nota01");
    			attr_dev(input1, "min", "0.0");
    			attr_dev(input1, "max", "10.0");
    			attr_dev(input1, "placeholder", "...");
    			add_location(input1, file$1, 33, 12, 765);
    			attr_dev(input2, "name", "nota02");
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "id", "nota02");
    			attr_dev(input2, "min", "0.0");
    			attr_dev(input2, "max", "10.0");
    			attr_dev(input2, "placeholder", "...");
    			add_location(input2, file$1, 34, 12, 898);
    			add_location(label0, file$1, 30, 8, 645);
    			add_location(h31, file$1, 37, 8, 1063);
    			add_location(p2, file$1, 38, 8, 1093);
    			attr_dev(input3, "name", "nota02");
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "id", "nota02");
    			attr_dev(input3, "min", "0.0");
    			attr_dev(input3, "max", "10.0");
    			attr_dev(input3, "placeholder", "...");
    			add_location(input3, file$1, 39, 12, 1167);
    			attr_dev(input4, "name", "nota02");
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "id", "nota02");
    			attr_dev(input4, "min", "0.0");
    			attr_dev(input4, "max", "10.0");
    			attr_dev(input4, "placeholder", "...");
    			add_location(input4, file$1, 40, 12, 1300);
    			add_location(label1, file$1, 36, 8, 1046);
    			add_location(button, file$1, 45, 12, 1469);
    			add_location(h2, file$1, 46, 12, 1530);
    			add_location(div1, file$1, 44, 8, 1450);
    			add_location(for_1, file$1, 25, 6, 455);
    			add_location(div2, file$1, 23, 1, 417);
    			add_location(body, file$1, 22, 0, 408);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div2);
    			append_dev(div2, h1);
    			append_dev(div2, t1);
    			append_dev(div2, for_1);
    			append_dev(for_1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, b);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*nome*/ ctx[0]);
    			append_dev(for_1, t4);
    			append_dev(for_1, label0);
    			append_dev(label0, h30);
    			append_dev(label0, t6);
    			append_dev(label0, p1);
    			append_dev(label0, t8);
    			append_dev(label0, input1);
    			set_input_value(input1, /*NotasToTal*/ ctx[1].notas[0]);
    			append_dev(label0, t9);
    			append_dev(label0, input2);
    			set_input_value(input2, /*NotasToTal*/ ctx[1].notas[1]);
    			append_dev(for_1, t10);
    			append_dev(for_1, label1);
    			append_dev(label1, h31);
    			append_dev(label1, t12);
    			append_dev(label1, p2);
    			append_dev(label1, t14);
    			append_dev(label1, input3);
    			set_input_value(input3, /*NotasToTal*/ ctx[1].notas[2]);
    			append_dev(label1, t15);
    			append_dev(label1, input4);
    			set_input_value(input4, /*NotasToTal*/ ctx[1].notas[3]);
    			append_dev(for_1, t16);
    			append_dev(for_1, div1);
    			append_dev(div1, button);
    			append_dev(div1, t18);
    			append_dev(div1, h2);
    			append_dev(h2, t19);
    			append_dev(h2, t20);
    			append_dev(h2, t21);
    			insert_dev(target, t22, anchor);
    			mount_component(voltarmenu, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[6]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[7]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[8]),
    					listen_dev(button, "click", /*calcular*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*nome*/ 1 && input0.value !== /*nome*/ ctx[0]) {
    				set_input_value(input0, /*nome*/ ctx[0]);
    			}

    			if (dirty & /*NotasToTal*/ 2 && to_number(input1.value) !== /*NotasToTal*/ ctx[1].notas[0]) {
    				set_input_value(input1, /*NotasToTal*/ ctx[1].notas[0]);
    			}

    			if (dirty & /*NotasToTal*/ 2 && to_number(input2.value) !== /*NotasToTal*/ ctx[1].notas[1]) {
    				set_input_value(input2, /*NotasToTal*/ ctx[1].notas[1]);
    			}

    			if (dirty & /*NotasToTal*/ 2 && to_number(input3.value) !== /*NotasToTal*/ ctx[1].notas[2]) {
    				set_input_value(input3, /*NotasToTal*/ ctx[1].notas[2]);
    			}

    			if (dirty & /*NotasToTal*/ 2 && to_number(input4.value) !== /*NotasToTal*/ ctx[1].notas[3]) {
    				set_input_value(input4, /*NotasToTal*/ ctx[1].notas[3]);
    			}

    			if (!current || dirty & /*nome*/ 1) set_data_dev(t19, /*nome*/ ctx[0]);
    			if (!current || dirty & /*media*/ 4) set_data_dev(t21, /*media*/ ctx[2]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(voltarmenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(voltarmenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			if (detaching) detach_dev(t22);
    			destroy_component(voltarmenu, detaching);
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
    	validate_slots('Media', slots, []);
    	let nome = "";

    	class Alunos {
    		constructor(nome, notas) {
    			this.nome = nome;
    			this.notas = notas;
    		}
    	}

    	let NotasToTal = new Alunos("", ["", "", "", ""]);
    	let media = 0;

    	function calcular() {
    		$$invalidate(2, media = (NotasToTal.notas[0] + NotasToTal.notas[1] + NotasToTal.notas[2] + NotasToTal.notas[3]) / 4);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Media> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		nome = this.value;
    		$$invalidate(0, nome);
    	}

    	function input1_input_handler() {
    		NotasToTal.notas[0] = to_number(this.value);
    		$$invalidate(1, NotasToTal);
    	}

    	function input2_input_handler() {
    		NotasToTal.notas[1] = to_number(this.value);
    		$$invalidate(1, NotasToTal);
    	}

    	function input3_input_handler() {
    		NotasToTal.notas[2] = to_number(this.value);
    		$$invalidate(1, NotasToTal);
    	}

    	function input4_input_handler() {
    		NotasToTal.notas[3] = to_number(this.value);
    		$$invalidate(1, NotasToTal);
    	}

    	$$self.$capture_state = () => ({
    		VoltarMenu,
    		nome,
    		Alunos,
    		NotasToTal,
    		media,
    		calcular
    	});

    	$$self.$inject_state = $$props => {
    		if ('nome' in $$props) $$invalidate(0, nome = $$props.nome);
    		if ('NotasToTal' in $$props) $$invalidate(1, NotasToTal = $$props.NotasToTal);
    		if ('media' in $$props) $$invalidate(2, media = $$props.media);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		nome,
    		NotasToTal,
    		media,
    		calcular,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler
    	];
    }

    class Media extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Media",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Sobre.svelte generated by Svelte v3.44.3 */
    const file = "src\\Sobre.svelte";

    function create_fragment$1(ctx) {
    	let link;
    	let t0;
    	let body;
    	let main;
    	let section;
    	let h1;
    	let br0;
    	let t2;
    	let h30;
    	let t4;
    	let p0;
    	let t6;
    	let h31;
    	let t8;
    	let p1;
    	let t10;
    	let br1;
    	let t11;
    	let voltarmenu;
    	let current;
    	voltarmenu = new VoltarMenu({ $$inline: true });

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			body = element("body");
    			main = element("main");
    			section = element("section");
    			h1 = element("h1");
    			h1.textContent = "SOBRE";
    			br0 = element("br");
    			t2 = space();
    			h30 = element("h3");
    			h30.textContent = "1. Qual objetivo do sistema?";
    			t4 = space();
    			p0 = element("p");
    			p0.textContent = "O objetivo deste sistema é de calcular as notas de um aluno específico para saber se passou de ano, a partir da média aritmética dos dois semestres.";
    			t6 = space();
    			h31 = element("h3");
    			h31.textContent = "2. Como utilizar?";
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "Apenas colocando as notas da I e II unidades, dos dois semestre e prontinho! :)";
    			t10 = space();
    			br1 = element("br");
    			t11 = space();
    			create_component(voltarmenu.$$.fragment);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "/styles/sobre.css");
    			add_location(link, file, 1, 1, 16);
    			add_location(h1, file, 12, 2, 206);
    			add_location(br0, file, 12, 16, 220);
    			add_location(h30, file, 13, 3, 229);
    			add_location(p0, file, 14, 3, 271);
    			add_location(h31, file, 16, 3, 433);
    			add_location(p1, file, 17, 3, 464);
    			attr_dev(section, "class", "conteudo");
    			add_location(section, file, 11, 2, 176);
    			add_location(main, file, 10, 1, 165);
    			add_location(body, file, 8, 0, 154);
    			add_location(br1, file, 22, 0, 588);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, body, anchor);
    			append_dev(body, main);
    			append_dev(main, section);
    			append_dev(section, h1);
    			append_dev(section, br0);
    			append_dev(section, t2);
    			append_dev(section, h30);
    			append_dev(section, t4);
    			append_dev(section, p0);
    			append_dev(section, t6);
    			append_dev(section, h31);
    			append_dev(section, t8);
    			append_dev(section, p1);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t11, anchor);
    			mount_component(voltarmenu, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(voltarmenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(voltarmenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(body);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t11);
    			destroy_component(voltarmenu, detaching);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sobre', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sobre> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ VoltarMenu });
    	return [];
    }

    class Sobre extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sobre",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.3 */

    // (16:30) 
    function create_if_block_2(ctx) {
    	let sobre;
    	let current;
    	sobre = new Sobre({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(sobre.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sobre, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sobre.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sobre.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sobre, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(16:30) ",
    		ctx
    	});

    	return block;
    }

    // (14:30) 
    function create_if_block_1(ctx) {
    	let media;
    	let current;
    	media = new Media({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(media.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(media, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(media.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(media.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(media, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(14:30) ",
    		ctx
    	});

    	return block;
    }

    // (11:0) {#if $estado === 'menu'}
    function create_if_block(ctx) {
    	let menu;
    	let current;
    	menu = new Menu({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(menu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(menu, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(menu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(11:0) {#if $estado === 'menu'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$estado*/ ctx[0] === 'menu') return 0;
    		if (/*$estado*/ ctx[0] === 'media') return 1;
    		if (/*$estado*/ ctx[0] === 'sobre') return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
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
    	let $estado;
    	validate_store(estado, 'estado');
    	component_subscribe($$self, estado, $$value => $$invalidate(0, $estado = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Menu, Media, Sobre, estado, $estado });
    	return [$estado];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
