/* Nebulan.js */
(function($) {
    KWNebulan = {
        ctx: {},
        frame: {},
        width: 0,
        height: 0,
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
            while (vector[0]*vector[0]+vector[1]*vector[0]>=1)
                vector = [Math.random(), Math.random()];
            return $V(vector);
        },
        Frame: function (width, height, sample_size) {
            var self = this;
            self.frame = [];
            self.width = width;
            self.height = height;
            self.sample_size = sample_size;
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
            self.generateNoise = function () {
                var self = this;
                
                var table_size = 256;

                // Permutation table
                var permutation = new Array(table_size);
                for (var i = permutation.length - 1; i >= 0; i--) {
                    permutation[i] = i;
                };

                // Shuffle Permutation table
                for (var i = permutation.length - 1; i >= 0; i--) {
                    var j = parseInt(Math.random() * i);
                    // swap p[i] and p[j]
                    var t = permutation[i];
                    permutation[i] = permutation[j];
                    permutation[j] = t;
                };

                // Gradient generation
                var gradient = new Array(table_size);
                for (var i = gradient.length - 1; i >= 0; i--) {
                    gradient[i] = KWNebulan.generateRandomVector();
                };

                // Noise generation
                for (i = 0; i < self.width; i+=self.sample_size)
                    for (j = 0; j < self.height; j+=self.sample_size)
                    {
                        // Setup neighbor
                        var neighbor = [];
                        neighbor.push($V([i, j]));
                        neighbor.push($V([i+self.sample_size, j]));
                        neighbor.push($V([i+self.sample_size, j+self.sample_size]));
                        neighbor.push($V([i, j+self.sample_size]));
                        
                        var neighbor_tl = neighbor[0];
                        var neighbor_br = neighbor[2];

                        if (neighbor_br.elements[0] > self.width)
                            neighbor_br.elements[0] = self.width;
                        if (neighbor_br.elements[1] > self.height)
                            neighbor_br.elements[1] = self.height;

                        // Render sample tile
                        var x, y, n;
                        for (x = neighbor_tl.elements[0]; x < neighbor_br.elements[0]; x++)
                            for (y = neighbor_tl.elements[1]; y < neighbor_br.elements[1]; y++)
                            {
                                var point = $V([x,y]);
                                var neighbor_dot_color = [];
                                for (n = 0; n < neighbor.length; n++)
                                {   
                                    // Calculation
                                    var nx = neighbor[n].elements[0] % table_size;
                                    var ny = neighbor[n].elements[1] % table_size;
                                    var gradient_vector = gradient[ permutation[ ( permutation[ nx ] + ny ) % table_size ] ];
                                    neighbor_dot_color.push(gradient_vector.dot(point.subtract(neighbor[n])));
                                }

                                // Interpolation
                                var tx = (x - neighbor_tl.elements[0])/(self.sample_size);
                                var tx_eased = KWNebulan.calcEasingCurve(tx);

                                var top_color = neighbor_dot_color[0] + tx_eased * (neighbor_dot_color[1] - neighbor_dot_color[0]);
                                var bottom_color = neighbor_dot_color[3] + tx_eased * (neighbor_dot_color[2] - neighbor_dot_color[3]);

                                var ty = (y - neighbor_tl.elements[1])/(self.sample_size);
                                var ty_eased = KWNebulan.calcEasingCurve(ty);

                                var new_color = top_color + ty_eased * (bottom_color - top_color);
                                self.frame[x][y].elements[0] = new_color;
                            }
                    }
            };
            this.generateFBM = function ( noise ) {
                // Fractual Brownian Motion
                var self = this;

                var gain = 0.75;
                var lacunarity = 1.8715;
                var octaves = 16.0;
                var i, j, k;
                for (i = 0; i < self.width; i++)
                    for (j = 0; j < self.height; j++) {
                        var total = 0.0;
                        var freq = 1.0/self.height;
                        var amp = gain;

                        for (k = 0; k < octaves; k++)
                        {
                            total += noise.getValue(parseInt(i*freq), parseInt(j*freq))/255 * amp;
                            freq *= lacunarity;
                            amp *= gain;
                        }

                        self.frame[i][j].elements[0] = total;
                }
                console.log(freq);
                
            };
        },
        renderFrame: function ( f ) {
            var self = KWNebulan;
            var x, y;
            for (x = 0; x < self.width; x++)
                for (y = 0; y < self.height; y++)
                {
                    self.ctx.fillStyle = "rgb("+f.frame[x][y].elements[0]+","
                                          +f.frame[x][y].elements[0]+","
                                          +f.frame[x][y].elements[0]+")";
                    self.ctx.fillRect(x,y,1,1);
                }
        },
        setup: function() {
            var self = KWNebulan;
            var canvas = document.getElementById("canvas");
            self.ctx = canvas.getContext("2d");

            self.width = canvas.width;
            self.height = canvas.height;
            var sample_size = 20;
            var noise_frame = new self.Frame(self.width*4, self.height*4, sample_size);
            noise_frame.generateNoise();
            noise_frame.normalize();
            console.log("test");
            // var fbm_frame = new self.Frame(self.width, self.height, sample_size);
            // fbm_frame.generateFBM(noise_frame);
            // fbm_frame.normalize();

            self.renderFrame(noise_frame);
            noise_frame.print();
        }
    };
    $(KWNebulan.setup);
})(jQuery);