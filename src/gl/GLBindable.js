function normaliseAllBound(args) {
	const resolvedArgs = [];
	for (let i = 0; i < args.length; ++ i) {
		const arg = args[i];
		if (typeof arg.doBound === 'function') {
			resolvedArgs.push({ v: arg, t: undefined });
		} else {
			Object.keys(arg).forEach((key) => resolvedArgs.push({ v: arg[key], t: key }));
		}
	}
	return resolvedArgs;
}

function doAllBound(items, idx, fn) {
	const item = items[idx];
	if (idx >= items.length) {
		return fn();
	}
	item.v.doBound(item.t, () => doAllBound(items, idx + 1, fn));
}

class GLBindable {
	constructor(gl, object, bindFn, currentBindingParamFn, deleteFn) {
		this.gl = gl;
		this.object = object;
		this._bindFn = bindFn;
		this._currentBindingParamFn = currentBindingParamFn;
		this._deleteFn = deleteFn;
	}

	doBound(overrideTarget, fn) {
		if (typeof overrideTarget === 'function') {
			fn = overrideTarget;
			overrideTarget = null;
		}
		if (!this.object) {
			if (this.gl.isContextLost()) {
				return fn();
			}
			throw new Error('unbindable object');
		}
		const resolvedTarget = overrideTarget || this.target;
		const bindingParam = this._currentBindingParamFn(resolvedTarget);
		if (!bindingParam) {
			throw new Error(`Cannot bind to ${resolvedTarget}`);
		}
		const oldBinding = this.gl.getParameter(bindingParam);

		if (oldBinding === this.object) {
			return fn();
		}

		this._bindFn(this.gl, this.object, resolvedTarget);
		try {
			return fn();
		} finally {
			this._bindFn(this.gl, oldBinding, resolvedTarget);
		}
	}

	delete() {
		if (!this.object) {
			if (this.gl.isContextLost()) {
				return;
			}
			throw new Error('cannot delete incomplete object');
		}
		this._deleteFn(this.gl, this.object);
		this.object = null;
	}

	static of(...args) {
		const resolvedArgs = normaliseAllBound(args);
		return {
			doBound: (fn) => doAllBound(resolvedArgs, 0, fn),
		};
	}
}
