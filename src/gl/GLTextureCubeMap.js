class GLTextureCubeMap extends GLTexture {
	constructor(gl, internalFormat, size, {
		format = null,
		type = null,
		data = null,
		unpackAlignment = 1,
		mipmapLevels = 1,
		parameters = {},
	}) {
		super(gl, gl.createTexture(), WebGL.TEXTURE_CUBE_MAP, internalFormat);
		this.setParameters(parameters);
		this.mipmapLevels = mipmapLevels;
		this.parameters = parameters;
		this.immutable = false;

		this.faces = {};
		GLTextureCubeMap.FACES.forEach((faceId) => {
			this.faces[faceId] = new GLTextureCubeMapFace(gl, faceId, this);
		});

		if (data) {
			this.doBound(() => GLTextureCubeMap.FACES.forEach((faceId) => {
				this.faces[faceId].loadImage(data[faceId], size, size, { format, type, unpackAlignment });
			}));
			if (mipmapLevels > 1) {
				throw new Error('unimplemented');
			}
		} else {
			this.resize(size, { immutable: true });
		}
	}

	getFace(id) {
		return this.faces[id];
	}

	rebuild() {
		this.delete();
		this.object = this.gl.createTexture();
		this.setParameters(this.parameters);
		GLTextureCubeMap.FACES.forEach((faceId) => {
			this.faces[faceId].object = this.object;
		});
	}

	resize(size, { immutable = null } = {}) {
		const s = Math.max(size, 1);
		if (s === this.size) {
			return;
		}
		if (this.immutable) {
			this.rebuild();
		}
		if (immutable !== null) {
			this.immutable = immutable;
		}
		this.size = s;
		if (this.immutable) {
			this.doBound(() => this.gl.texStorage2D(
				this.target,
				this.mipmapLevels,
				this.internalFormat,
				this.size,
				this.size,
			));
		} else {
			GLTextureCubeMap.FACES.forEach((faceId) => this.faces[faceId].loadImage(null, this.size, this.size));
		}
	}
}

GLTextureCubeMap.FACES = [
	WebGL.TEXTURE_CUBE_MAP_POSITIVE_X,
	WebGL.TEXTURE_CUBE_MAP_NEGATIVE_X,
	WebGL.TEXTURE_CUBE_MAP_POSITIVE_Y,
	WebGL.TEXTURE_CUBE_MAP_NEGATIVE_Y,
	WebGL.TEXTURE_CUBE_MAP_POSITIVE_Z,
	WebGL.TEXTURE_CUBE_MAP_NEGATIVE_Z,
];

class GLTextureCubeMapFace extends GLTexture {
	constructor(gl, target, parent) {
		super(gl, parent.object, target, parent.internalFormat);
		this.parent = parent;
	}

	doBound() {
		throw new Error('cannot bind one face of a cube map');
	}

	delete() {
		throw new Error('cannot delete one face of a cube map');
	}

	loadImage(data, width, height, {
		format = null,
		type = null,
		unpackAlignment = 1,
		mipmapLevel = 0,
	} = {}) {
		const match = GLTexture.getFormatType(this.internalFormat, format, type);
		this.gl.pixelStorei(WebGL.UNPACK_ALIGNMENT, unpackAlignment);

		this.parent.doBound(() => this.gl.texImage2D(this.target, mipmapLevel, this.internalFormat, width, height, 0, match.format, match.type, data));
	}

	loadSubImage(data, xoff, yoff, width, height, {
		format = null,
		type = null,
		unpackAlignment = 1,
		mipmapLevel = 0,
	} = {}) {
		const match = GLTexture.getFormatType(this.internalFormat, format, type);
		this.gl.pixelStorei(WebGL.UNPACK_ALIGNMENT, unpackAlignment);

		this.parent.doBound(() => this.gl.texSubImage2D(this.target, mipmapLevel, xoff, yoff, width, height, match.format, match.type, data));
	}
}

Object.assign(WebGL.prototype, {
	createTextureCubeMap(...args) {
		return new GLTextureCubeMap(this.gl, ...args);
	},
});
