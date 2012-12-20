/* Nebulan.js */
(function($) {
    KWNebulan = {
        canvas: {},
        randomColor: function () {
            return parseInt(Math.random()*255);
        },
        randomColorVector: function () {
            var self = KWNebulan;
            return $V([self.randomColor(), self.randomColor(), self.randomColor()]);
        },
        calcEasingCurve: function (t) {
            // Using S-Curve
            //return 3 * Math.pow(t, 2) - 2 * Math.pow(t, 3);
            return 6 * Math.pow(t, 5) - 15 * Math.pow(t, 4) + 10 * Math.pow(t, 3);
            //return t;
        },
        generateRandomVector: function () {
            // Using Monte Carlo method
            // Select vectors with distance less than 1
            var vector = [1, 1];
            while (vector[0] * vector[0] + vector[1] * vector[1] >= 1)
                vector = [Math.random(), Math.random()];
            return $V(vector);
        },
        NoisePerlin: function (grid_size) {
            var self = this;
            self.table_size = 256;
            self.grid_size = (grid_size == undefined) ? 1: grid_size;

            // Permutation table
            self.permutation = new Array(self.table_size);
            for (var i = self.permutation.length - 1; i >= 0; i--) {
                self.permutation[i] = i;
            };

            // Shuffle Permutation table
            for (var i = self.permutation.length - 1; i >= 0; i--) {
                var j = parseInt(Math.random() * i);
                // swap p[i] and p[j]
                var t = self.permutation[i];
                self.permutation[i] = self.permutation[j];
                self.permutation[j] = t;
            };

            // Gradient generation
            self.gradient = new Array(self.table_size);
            for (var i = self.gradient.length - 1; i >= 0; i--) {
                self.gradient[i] = KWNebulan.generateRandomVector();
            };

            self.noise = function (x, y) {
                var self = this;
                // Setup neighbor
                var i = parseInt(x);
                var j = parseInt(y);
                var neighbor = [];
                neighbor.push($V([i, j]));
                neighbor.push($V([i+self.grid_size, j]));
                neighbor.push($V([i+self.grid_size, j+self.grid_size]));
                neighbor.push($V([i, j+self.grid_size]));
                
                var neighbor_tl = neighbor[0];
                var neighbor_br = neighbor[2];

                // Render point
                var point = $V([x,y]);
                var neighbor_dot_color = [];
                for (var n = 0; n < neighbor.length; n++)
                {
                    // Calculation
                    var nx = neighbor[n].elements[0] % self.table_size;
                    var ny = neighbor[n].elements[1] % self.table_size;
                    var gradient_vector = self.gradient[ self.permutation[ ( self.permutation[ nx ] + ny ) % self.table_size ] ];
                    neighbor_dot_color.push(gradient_vector.dot(point.subtract(neighbor[n])));
                }

                // Interpolation
                var tx = (x - neighbor_tl.elements[0]) / self.grid_size;
                var tx_eased = KWNebulan.calcEasingCurve(tx);

                var top_color = neighbor_dot_color[0] + tx_eased * (neighbor_dot_color[1] - neighbor_dot_color[0]);
                var bottom_color = neighbor_dot_color[3] + tx_eased * (neighbor_dot_color[2] - neighbor_dot_color[3]);

                var ty = (y - neighbor_tl.elements[1]) / self.grid_size;
                var ty_eased = KWNebulan.calcEasingCurve(ty);

                var new_color = top_color + ty_eased * (bottom_color - top_color);

                return new_color;
            }


        },
        Frame: function (frame_size) {
            var self = this;
            self.frame = [];
            self.width = frame_size.elements[0];
            self.height = frame_size.elements[1];
            var i, j;
            // initial randomization
            for (i = 0; i < self.width; i++)
            {
                var column = [];
                for (j = 0; j < self.height; j++)
                {
                    column.push(KWNebulan.randomColorVector());
                }
                self.frame.push(column);
            }
            self.getValue = function (x, y) {
                var self = this;
                return self.frame[x%self.width][y%self.height].elements[0];
            };
            self.normalize = function () {
                var self = this;
                var x, y;
                var min = self.frame[0][0].elements[0];
                var max = self.frame[0][0].elements[0];
                for (x = 0; x < self.width; x++)
                    for (y = 0; y < self.height; y++)
                    {
                        var value = self.frame[x][y].elements[0];
                        if(self.frame[x][y].elements[0] < min)
                            min = self.frame[x][y].elements[0];
                        if(self.frame[x][y].elements[0] > max)
                            max = self.frame[x][y].elements[0];
                    }
                var range = max - min;
                console.log(min)
                console.log(max)
                for (x = 0; x < self.width; x++)
                    for (y = 0; y < self.height; y++)
                    {
                        self.frame[x][y].elements[0] -= min ;
                        self.frame[x][y].elements[0] *= 255/range;
                        self.frame[x][y].elements[0] = parseInt(self.frame[x][y].elements[0]);
                    }
            };
            self.print = function () {
                var self = this;
                var x, y;
                var output = "";
                for (x = 0; x < self.width; x++)
                {
                    for (y = 0; y < self.height; y++)
                    {
                        output += self.frame[x][y].elements[0] + ",\t";
                    }
                    output += "\n";
                }
                console.log(output);
            },
            self.generateNoise = function (aScale) {
                var self = this;
                var scale = (aScale == undefined)? 1: aScale;
                var n = new KWNebulan.NoisePerlin();
                // Noise generation
                for (i = 0; i < self.width; i++)
                    for (j = 0; j < self.height; j++)
                        self.frame[i][j].elements[0] = n.noise(i*scale/self.width, j*scale/self.height);
                self.normalize();
            };
            this.generateFBM = function () {
                // Fractual Brownian Motion
                var self = this;

                var gain = 0.5;
                var lacunarity = 2.0;
                var octaves = 16.0;

                var n = new KWNebulan.NoisePerlin();
                var i, j, k;
                for (i = 0; i < self.width; i++)
                    for (j = 0; j < self.height; j++) {
                        var total = 0.0;
                        var freq = 1.0/self.height;
                        var amp = gain;

                        for (k = 0; k < octaves; k++)
                        {
                            total += n.noise(i*freq, j*freq) * amp;
                            freq *= lacunarity;
                            amp *= gain;
                        }
                        self.frame[i][j].elements[0] = total;
                }
                self.normalize();
            };
        },
        renderFrame: function (aFrame) {
            var self = KWNebulan;
            var ctx = self.canvas.getContext("2d");
            for (var x = self.canvas.width - 1; x >= 0 ; x--)
                for (var y = self.canvas.height - 1; y >= 0 ; y--)
                {
                    ctx.fillStyle = "rgb("+aFrame.frame[x][y].elements[0]+","
                                          +aFrame.frame[x][y].elements[0]+","
                                          +aFrame.frame[x][y].elements[0]+")";
                    ctx.fillRect(x,y,1,1);
                }
        },
        setup: function () {
            var self = KWNebulan;
            self.canvas = document.getElementById("canvas");
            
            var canvas_size = $V([canvas.width, canvas.height]);
            var noise_frame = new self.Frame(canvas_size);
            noise_frame.generateNoise();

            var fbm_frame = new self.Frame(canvas_size);
            fbm_frame.generateFBM();

            var output = noise_frame;
            self.renderFrame(output);
        }
    };
    $(KWNebulan.setup);
})(jQuery);