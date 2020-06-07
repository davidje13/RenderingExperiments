class GLTexture3D extends GLTexture {
	constructor(gl, internalFormat, width, height, depth, {
		format = null,
		type = null,
		data = null,
		unpackAlignment = 1,
		mipmapLevels = 1,
		parameters = {},
	} = {}, _typeOverride = null) {
		super(gl, gl.createTexture(), _typeOverride || WebGL.TEXTURE_3D, internalFormat);
		this.setParameters(parameters);
		this.mipmapLevels = mipmapLevels;
		this.parameters = parameters;
		this.immutable = false;
		if (data) {
			this.loadImage(data, width, height, depth, { format, type, unpackAlignment });
			if (mipmapLevels > 1) {
				throw new Error('unimplemented');
			}
		} else {
			this.resize(width, height, depth, { immutable: true });
		}
	}

	rebuild() {
		this.delete();
		this.object = this.gl.createTexture();
		this.setParameters(this.parameters);
	}

	resize(width, height, depth, { immutable = null } = {}) {
		const w = Math.max(width, 1);
		const h = Math.max(height, 1);
		const d = Math.max(depth, 1);
		if (w === this.width && h === this.height && d === this.depth) {
			return;
		}
		if (this.immutable) {
			this.rebuild();
		}
		if (immutable !== null) {
			this.immutable = immutable;
		}
		this.width = w;
		this.height = h;
		this.depth = d;
		if (this.immutable) {
			this.doBound(() => this.gl.texStorage3D(
				this.target,
				this.mipmapLevels,
				this.internalFormat,
				this.width,
				this.height,
				this.depth,
			));
		} else {
			this.loadImage(null, width, height, depth);
		}
	}

	loadImage(data, width, height, depth, {
		format = null,
		type = null,
		unpackAlignment = 1,
		mipmapLevel = 0,
	} = {}) {
		if (this.immutable) {
			if (
				(width << mipmapLevel) !== this.width ||
				(height << mipmapLevel) !== this.height ||
				(depth << mipmapLevel) !== this.depth
			) {
				throw new Error('Cannot load data of different size into immutable texture');
			}
			return this.loadSubImage(data, 0, 0, 0, width, height, depth, {
				format,
				type,
				unpackAlignment,
				mipmapLevel,
			});
		}

		if (data && (width <= 0 || height <= 0 || depth <= 0)) {
			throw new Error(`Invalid image dimension ${width} x ${height} x ${depth}`);
		}
		this.width = Math.max(width << mipmapLevel, 1);
		this.height = Math.max(height << mipmapLevel, 1);
		this.depth = Math.max(depth << mipmapLevel, 1);
		const match = GLTexture.getFormatType(this.internalFormat, format, type);
		this.gl.pixelStorei(WebGL.UNPACK_ALIGNMENT, unpackAlignment);

		this.doBound(() => this.gl.texImage3D(
			this.target,
			mipmapLevel,
			this.internalFormat,
			this.width >> mipmapLevel,
			this.height >> mipmapLevel,
			this.depth >> mipmapLevel,
			0,
			match.format,
			match.type,
			data,
		));
	}

	loadSubImage(data, xoff, yoff, zoff, width, height, depth, {
		format = null,
		type = null,
		unpackAlignment = 1,
		mipmapLevel = 0,
	} = {}) {
		const match = GLTexture.getFormatType(this.internalFormat, format, type);
		this.gl.pixelStorei(WebGL.UNPACK_ALIGNMENT, unpackAlignment);

		this.doBound(() => this.gl.texSubImage3D(this.target, mipmapLevel, xoff, yoff, zoff, width, height, depth, match.format, match.type, data));
	}
}

Object.assign(WebGL.prototype, {
	createTexture3D(...args) {
		return new GLTexture3D(this.gl, ...args);
	},
});
