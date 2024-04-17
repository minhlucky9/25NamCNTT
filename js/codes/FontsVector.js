class FontVector {
    
    constructor() {
        this.rowmans_curves = [];
        this.rowmans_dict = {};

        this.LoadHersheyFont();
        this.InitDictionary();
    }

    LoadHersheyFont() {
        let loader = new THREE.FileLoader();
        let fontCurves = this.rowmans_curves;
        loader.load("/fonts/hershey/rowmans.jhf", function(font) {
            
            let lines = font.split('\n');

            for(let i = 0; i < lines.length; i ++){
                let descriptor = lines[i];
                let R = 'R'.charCodeAt(0);
                let number = parseInt(descriptor.substr(0, 5));
                let left = descriptor[8].charCodeAt(0) - R;
                let right = descriptor[9].charCodeAt(0) - R;
                let numVertices = parseInt(descriptor.substr(5, 3), 10) - 1;

                let curves = [];
                let currentPath = [];
                for(let v = 0; v < numVertices; v++) {
                    const x = descriptor[10 + v * 2].charCodeAt(0) - R
                    const y = descriptor[11 + v * 2].charCodeAt(0) - R
                    if ((x === -50) && (y === 0)) {
                        curves.push(currentPath)
                        currentPath = []
                    } else {
                        currentPath.push([x, y])
                    }
                }
                curves.push(currentPath)

                fontCurves['' + number] = curves;
            }
        })
    }   

    InitDictionary() {
        this.rowmans_dict = {
            'A': 501,
            'B': 502,
            'C': 503,
            'D': 504,
            'E': 505,
            'F': 506,
            'G': 507,
            'H': 508,
            'I': 509,
            'J': 510,
            'K': 511,
            'L': 512,
            'M': 513,
            'N': 514,
            'O': 515,
            'P': 516,
            'Q': 517,
            'R': 518,
            'S': 519,
            'T': 520,
            'U': 521,
            'V': 522,
            'W': 523,
            'X': 524,
            'Y': 525,
            'Z': 526,
            'a': 601,
            'b': 602,
            'c': 603,
            'd': 604,
            'e': 605,
            'f': 606,
            'g': 607,
            'h': 608,
            'i': 609,
            'j': 610,
            'k': 611,
            'l': 612,
            'm': 613,
            'n': 614,
            'o': 615,
            'p': 616,
            'q': 617,
            'r': 618,
            's': 619,
            't': 620,
            'u': 621,
            'v': 622,
            'w': 623,
            'x': 624,
            'y': 625,
            'z': 626,
            ' ': 699,
            '0': 700,
            '1': 701,
            '2': 702,
            '3': 703,
            '4': 704,
            '5': 705,
            '6': 706,
            '7': 707,
            '8': 708,
            '9': 709,
            '.': 710,
            ',': 711,
            ':': 712,
            ';': 713,
            '!': 714,
            '?': 715,
            '"': 717,
            '°': 718,
            '$': 719,
            '/': 720,
            '(': 721,
            ')': 722,
            '|': 723,
            '-': 724,
            '+': 725,
            '=': 726,
            '\'': 731,
            '#': 733,
            '&': 734,
            '\\': 804,
            '_': 999,
            '*': 2219,
            '[': 2223,
            ']': 2224,
            '{': 2225,
            '}': 2226,
            '<': 2241,
            '>': 2242,
            '~': 2246,
            '%': 2271,
            '@': 2273
          }
    }

    IsExistInArray(point, array) {
    
        for(let i = 0; i < array.length; i++) {
            if(point.x == array[i].x && point.y == array[i].y && point.z == array[i].z )
            {
                return true;
            }
        }
    
        return false;
    }

    getPointsOfChar(char, nb_point, scale) {
        let vectors_of_char = this.rowmans_curves[this.rowmans_dict[char]];
        //calculate total length
        let length = 0;
        let results = [];
        for(let i = 0 ; i < vectors_of_char.length; i ++) {
            let vector = vectors_of_char[i];
    
            for(let j = 0; j < vector.length - 1; j ++) 
            {
                //point 1 and 2
                let p1 = new THREE.Vector3(vector[j][0], 0, vector[j][1]);
                let p2 = new THREE.Vector3(vector[j + 1][0], 0, vector[j + 1][1]);
                
                //if(!IsExistInArray(p1, results)) {results.push(p1.clone().multiplyScalar(scale));}
                //if(!IsExistInArray(p2, results)) {results.push(p2.clone().multiplyScalar(scale));}
    
                length += p2.distanceTo(p1);
            }
        }  
        
        let segmentLength = length / (nb_point);
        
        for(let i = 0 ; i < vectors_of_char.length; i ++) {
            let vector = vectors_of_char[i];
    
            for(let j = 0; j < vector.length - 1; j ++) 
            {
                //point 1 and 2
                let p1 = new THREE.Vector3(vector[j][0], 0, vector[j][1]);
                let p2 = new THREE.Vector3(vector[j + 1][0], 0, vector[j + 1][1]);
                let dir = p2.clone().sub(p1).normalize();
                let length = p2.distanceTo(p1);
                dir.normalize();
    
                let k = 1;
                while(true) {
                    let currentLength = k * segmentLength;
                    if(currentLength >= length) break;
                
                    let p = p1.clone().add( dir.clone().multiplyScalar(currentLength) ).multiplyScalar(scale);
                    results.push(p);
                    k++;
                }
            }
            
        }  
    
        return results;
    }
}