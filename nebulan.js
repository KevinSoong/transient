/* Nebulan.js */
(function($) {
    KWNebulan = {
        ctx: {},
        frame: {},
        width: 0,
        height: 0,
        sample_size: 40,
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
        createFrame: function () {
            var self = KWNebulan;
            self.frame = [];
            var i, j;
            // initial randomization
            for (i = 0; i < self.width; i++)
            {
                var column = [];
                for (j = 0; j < self.height; j++)
                {
                    column.push(self.randomColorVector());
                }
                self.frame.push(column);
            }
        },
        normalizeFrame: function () {
            var self = KWNebulan;
            var x, y;
            var min = 999999999;
            var max = -999999999;
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
        },
        printFrame: function () {
            var self = KWNebulan;
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
        updateFrame: function () {
            var self = KWNebulan;
            var x, y;
            for (x = 0; x < self.width; x++)
                for (y = 0; y < self.height; y++)
                {
                    self.ctx.fillStyle = "rgb("+self.frame[x][y].elements[0]+","
                                          +self.frame[x][y].elements[0]+","
                                          +self.frame[x][y].elements[0]+")";
                    self.ctx.fillRect(x,y,1,1);
                }
        },
        setup: function() {
            console.log("test");
            var self = KWNebulan;
            var canvas = document.getElementById("canvas");
            self.ctx = canvas.getContext("2d");

            self.width = canvas.width;
            self.height = canvas.height;
            self.createFrame();

            var i, j;

             // Gradient generation
            var random_vector = {};
            for (i = 0; i <= self.width; i+=self.sample_size)
                for (j = 0; j <= self.height; j+=self.sample_size)
                {
                    var position = $V([i, j]);
                    random_vector[position.elements] = self.generateRandomVector();
                }


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
                                neighbor_dot_color.push(random_vector[neighbor[n].elements].dot(point.subtract(neighbor[n])));
                            }

                            // Interpolation
                            var tx = (x - neighbor_tl.elements[0])/(self.sample_size);
                            var tx_eased = self.calcEasingCurve(tx);

                            var top_color = neighbor_dot_color[0] + tx_eased * (neighbor_dot_color[1] - neighbor_dot_color[0]);
                            var bottom_color = neighbor_dot_color[3] + tx_eased * (neighbor_dot_color[2] - neighbor_dot_color[3]);

                            var ty = (y - neighbor_tl.elements[1])/(self.sample_size);
                            var ty_eased = self.calcEasingCurve(ty);

                            var new_color = top_color + ty_eased * (bottom_color - top_color);
                            self.frame[x][y].elements[0] = new_color;
                        }
                }

            // Fractual Brownian Motion
            // total = 0.0;
            // freq = 1.0/hgrid;
            // amp = gain;

            // for (k = 0; k < octaves; k++)
            // {
            //     total += self.frame[parseInt(i*freq)][parseInt(j*freq)]*amp;
            //     freq *= lacunarity;
            //     amp *= gain;
            // }

            // map[i][j] = total;

            self.normalizeFrame();
            self.updateFrame();
            self.printFrame();
        }
    };
    $(KWNebulan.setup);
})(jQuery);