const KNOWN_INTERNAL_FORMATS = {
	// Thanks, https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
	[WebGL.LUMINANCE]:          { format: WebGL.LUMINANCE,       type: WebGL.UNSIGNED_BYTE  },
	[WebGL.ALPHA]:              { format: WebGL.ALPHA,           type: WebGL.UNSIGNED_BYTE  },
	[WebGL.R8]:                 { format: WebGL.RED,             type: WebGL.UNSIGNED_BYTE  },
	[WebGL.R8_SNORM]:           { format: WebGL.RED,             type: WebGL.BYTE           },
	[WebGL.R16F]:               { format: WebGL.RED,             type: WebGL.HALF_FLOAT     }, // FLOAT
	[WebGL.R32F]:               { format: WebGL.RED,             type: WebGL.FLOAT          },
	[WebGL.R8I]:                { format: WebGL.RED_INTEGER,     type: WebGL.BYTE           },
	[WebGL.R8UI]:               { format: WebGL.RED_INTEGER,     type: WebGL.UNSIGNED_BYTE  },
	[WebGL.R16I]:               { format: WebGL.RED_INTEGER,     type: WebGL.SHORT          },
	[WebGL.R16UI]:              { format: WebGL.RED_INTEGER,     type: WebGL.UNSIGNED_SHORT },
	[WebGL.R32I]:               { format: WebGL.RED_INTEGER,     type: WebGL.INT            },
	[WebGL.R32UI]:              { format: WebGL.RED_INTEGER,     type: WebGL.UNSIGNED_INT   },

	[WebGL.LUMINANCE_ALPHA]:    { format: WebGL.LUMINANCE_ALPHA, type: WebGL.UNSIGNED_BYTE  },
	[WebGL.RG8]:                { format: WebGL.RG,              type: WebGL.UNSIGNED_BYTE  },
	[WebGL.RG8_SNORM]:          { format: WebGL.RG,              type: WebGL.BYTE           },
	[WebGL.RG16F]:              { format: WebGL.RG,              type: WebGL.HALF_FLOAT     }, // FLOAT
	[WebGL.RG32F]:              { format: WebGL.RG,              type: WebGL.FLOAT          },
	[WebGL.RG8I]:               { format: WebGL.RG_INTEGER,      type: WebGL.BYTE           },
	[WebGL.RG8UI]:              { format: WebGL.RG_INTEGER,      type: WebGL.UNSIGNED_BYTE  },
	[WebGL.RG16I]:              { format: WebGL.RG_INTEGER,      type: WebGL.SHORT          },
	[WebGL.RG16UI]:             { format: WebGL.RG_INTEGER,      type: WebGL.UNSIGNED_SHORT },
	[WebGL.RG32I]:              { format: WebGL.RG_INTEGER,      type: WebGL.INT            },
	[WebGL.RG32UI]:             { format: WebGL.RG_INTEGER,      type: WebGL.UNSIGNED_INT   },

	[WebGL.RGB]:                { format: WebGL.RGB,             type: WebGL.UNSIGNED_BYTE  },
	[WebGL.RGB8]:               { format: WebGL.RGB,             type: WebGL.UNSIGNED_BYTE  },
	[WebGL.SRGB8]:              { format: WebGL.RGB,             type: WebGL.UNSIGNED_BYTE  },
	[WebGL.RGB8_SNORM]:         { format: WebGL.RGB,             type: WebGL.BYTE           },
	[WebGL.RGB565]:             { format: WebGL.RGB,             type: WebGL.UNSIGNED_BYTE  }, // UNSIGNED_SHORT_5_6_5
	[WebGL.RGB16F]:             { format: WebGL.RGB,             type: WebGL.HALF_FLOAT     }, // FLOAT
	[WebGL.R11F_G11F_B10F]:     { format: WebGL.RGB,             type: WebGL.HALF_FLOAT     }, // FLOAT, UNSIGNED_INT_10F_11F_11F_REV
	[WebGL.RGB9_E5]:            { format: WebGL.RGB,             type: WebGL.HALF_FLOAT     }, // FLOAT, UNSIGNED_INT_5_9_9_9_REV
	[WebGL.RGB32F]:             { format: WebGL.RGB,             type: WebGL.FLOAT          },
	[WebGL.RGB8I]:              { format: WebGL.RGB_INTEGER,     type: WebGL.BYTE           },
	[WebGL.RGB8UI]:             { format: WebGL.RGB_INTEGER,     type: WebGL.UNSIGNED_BYTE  },
	[WebGL.RGB16I]:             { format: WebGL.RGB_INTEGER,     type: WebGL.SHORT          },
	[WebGL.RGB16UI]:            { format: WebGL.RGB_INTEGER,     type: WebGL.UNSIGNED_SHORT },
	[WebGL.RGB32I]:             { format: WebGL.RGB_INTEGER,     type: WebGL.INT            },
	[WebGL.RGB32UI]:            { format: WebGL.RGB_INTEGER,     type: WebGL.UNSIGNED_INT   },

	[WebGL.RGBA]:               { format: WebGL.RGBA,            type: WebGL.UNSIGNED_BYTE  },
	[WebGL.RGBA4]:              { format: WebGL.RGBA,            type: WebGL.UNSIGNED_BYTE  }, // UNSIGNED_SHORT_4_4_4_4
	[WebGL.RGB5_A1]:            { format: WebGL.RGBA,            type: WebGL.UNSIGNED_BYTE  }, // UNSIGNED_SHORT_5_5_5_1, UNSIGNED_INT_2_10_10_10_REV
	[WebGL.RGBA8]:              { format: WebGL.RGBA,            type: WebGL.UNSIGNED_BYTE  },
	[WebGL.RGBA8_SNORM]:        { format: WebGL.RGBA,            type: WebGL.BYTE           },
	[WebGL.RGB10_A2]:           { format: WebGL.RGBA,            type: WebGL.UNSIGNED_INT_2_10_10_10_REV },
	[WebGL.SRGB8_ALPHA8]:       { format: WebGL.RGBA,            type: WebGL.UNSIGNED_BYTE  },
	[WebGL.RGBA16F]:            { format: WebGL.RGBA,            type: WebGL.HALF_FLOAT     }, // FLOAT
	[WebGL.RGBA32F]:            { format: WebGL.RGBA,            type: WebGL.FLOAT          },
	[WebGL.RGB10_A2UI]:         { format: WebGL.RGBA_INTEGER,    type: WebGL.UNSIGNED_INT_2_10_10_10_REV },
	[WebGL.RGBA8I]:             { format: WebGL.RGBA_INTEGER,    type: WebGL.BYTE           },
	[WebGL.RGBA8UI]:            { format: WebGL.RGBA_INTEGER,    type: WebGL.UNSIGNED_BYTE  },
	[WebGL.RGBA16I]:            { format: WebGL.RGBA_INTEGER,    type: WebGL.SHORT          },
	[WebGL.RGBA16UI]:           { format: WebGL.RGBA_INTEGER,    type: WebGL.UNSIGNED_SHORT },
	[WebGL.RGBA32I]:            { format: WebGL.RGBA_INTEGER,    type: WebGL.INT            },
	[WebGL.RGBA32UI]:           { format: WebGL.RGBA_INTEGER,    type: WebGL.UNSIGNED_INT   },

	[WebGL.DEPTH_COMPONENT16]:  { format: WebGL.DEPTH_COMPONENT, type: WebGL.UNSIGNED_SHORT }, // UNSIGNED_INT
	[WebGL.DEPTH_COMPONENT24]:  { format: WebGL.DEPTH_COMPONENT, type: WebGL.UNSIGNED_INT   },
	[WebGL.DEPTH_COMPONENT32F]: { format: WebGL.DEPTH_COMPONENT, type: WebGL.FLOAT          },
	[WebGL.DEPTH24_STENCIL8]:   { format: WebGL.DEPTH_STENCIL,   type: WebGL.UNSIGNED_INT_24_8 },
	[WebGL.DEPTH32F_STENCIL8]:  { format: WebGL.DEPTH_STENCIL,   type: WebGL.FLOAT_32_UNSIGNED_INT_24_8_REV },
	[WebGL.STENCIL_INDEX8]:     { format: WebGL.STENCIL,         type: WebGL.UNSIGNED_BYTE  },
};

const TEXTURE_BINDINGS = {
	[WebGL.TEXTURE_2D]:       WebGL.TEXTURE_BINDING_2D,
	[WebGL.TEXTURE_3D]:       WebGL.TEXTURE_BINDING_3D,
	[WebGL.TEXTURE_CUBE_MAP]: WebGL.TEXTURE_BINDING_CUBE_MAP,
	[WebGL.TEXTURE_2D_ARRAY]: WebGL.TEXTURE_BINDING_2D_ARRAY,
};

// TODO? WebGL.UNPACK_COLORSPACE_CONVERSION_WEBGL WebGL.BROWSER_DEFAULT_WEBGL / WebGL.NONE

const bindTexture = (gl, object, target) => gl.bindTexture(target, object);
const getBoundTextureParam = (target) => TEXTURE_BINDINGS[target];
const deleteTexture = (gl, object) => gl.deleteTexture(object);

class GLTexture extends GLBindable {
	constructor(gl, object, target, internalFormat) {
		super(gl, object, bindTexture, getBoundTextureParam, deleteTexture);
		this.target = target;
		this.internalFormat = internalFormat;
	}

	setParameters(parameters) {
		const keys = Object.keys(parameters);
		if (!keys.length) {
			return;
		}

		this.doBound(() => keys.forEach((key) => this.gl.texParameteri(this.target, key, parameters[key])));
	}

	generateMipmap() {
		this.doBound(() => this.gl.generateMipmap(this.target));
	}
}

GLTexture.getFormatType = function(internalFormat, format, type) {
	const match = KNOWN_INTERNAL_FORMATS[internalFormat];
	if (!match && (!format || !type)) {
		throw new Error(`Unknown internal format ${internalFormat}`);
	}
	return match || { format, type };
}
