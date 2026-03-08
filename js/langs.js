/* ═══════════════════════════════════════════
   LANGUAGE DEFINITIONS
═══════════════════════════════════════════ */
const LANGS = [
  {
    id:'javascript',label:'JavaScript',ext:['js','mjs'],dot:'#f7df1e',
    cm:'javascript',piston:null,
    code:`// JavaScript — runs directly in browser\nconsole.log("Hello from JavaScript! 🚀");\n\nconst greet = name =>\n  \`Welcome, \${name}! It is \${new Date().toLocaleTimeString()}\`;\nconsole.log(greet("CodeForge"));\n\n// Fibonacci\nconst fib = n => n <= 1 ? n : fib(n-1) + fib(n-2);\nfor (let i = 0; i <= 10; i++)\n  console.log(\`fib(\${i}) = \${fib(i)}\`);`
  },
  {
    id:'html',label:'HTML',ext:['html','htm'],dot:'#e34c26',
    cm:'htmlmixed',piston:null,
    code:`<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <style>\n    body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0}\n    .card{background:#fff;padding:40px;border-radius:16px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)}\n    h1{color:#333;margin-bottom:10px}\n    p{color:#666}\n    button{margin-top:20px;padding:12px 28px;background:#667eea;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer}\n    button:hover{background:#764ba2}\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>🎉 Hello, CodeForge!</h1>\n    <p>Your HTML renders live in the Preview tab.</p>\n    <button onclick="this.textContent='Clicked! ✅'">Click Me</button>\n  </div>\n</body>\n</html>`
  },
  {
    id:'python',label:'Python',ext:['py'],dot:'#3572A5',
    cm:'python',piston:'WASM',
    code:`# Python — runs in browser via Pyodide (no internet needed after first load)\nprint("Hello from Python! 🐍")\n\nsquares = [x**2 for x in range(1, 11)]\nprint("Squares:", squares)\n\ndef fibonacci(n):\n    a, b = 0, 1\n    result = []\n    for _ in range(n):\n        result.append(a)\n        a, b = b, a + b\n    return result\n\nprint("Fibonacci:", fibonacci(10))\n\nperson = {"name": "CodeForge", "version": 2.0, "awesome": True}\nfor k, v in person.items():\n    print(f"  {k}: {v}")`
  },
  {
    id:'cpp',label:'C++',ext:['cpp','cc','cxx'],dot:'#f34b7d',
    cm:'text/x-c++src',piston:'c++',
    code:`// C++ — via Piston API\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint fib(int n){ return n<=1?n:fib(n-1)+fib(n-2); }\n\nint main(){\n    cout << "Hello from C++! 🔥" << endl;\n    cout << "Fibonacci: ";\n    for(int i=0;i<=10;i++){\n        cout << fib(i);\n        if(i<10) cout << ", ";\n    }\n    cout << endl;\n    vector<int> v={3,1,4,1,5,9,2,6};\n    int s=0; for(int x:v) s+=x;\n    cout << "Vector sum: " << s << endl;\n    return 0;\n}`
  },
  {
    id:'c',label:'C',ext:['c'],dot:'#555555',
    cm:'text/x-csrc',piston:'c',
    code:`// C — via Piston API\n#include <stdio.h>\n\nint main(){\n    printf("Hello from C! 🏆\\n");\n    printf("Squares: ");\n    for(int i=1;i<=10;i++)\n        printf("%d%s", i*i, i<10?", ":"");\n    printf("\\n");\n    double pi=3.14159265, r=5.0;\n    printf("Circle area (r=5): %.4f\\n", pi*r*r);\n    return 0;\n}`
  },
  {
    id:'java',label:'Java',ext:['java'],dot:'#b07219',
    cm:'text/x-java',piston:'java',
    code:`// Java — via Piston API\nimport java.util.ArrayList;\nimport java.util.List;\n\npublic class Main {\n    static int fib(int n){ return n<=1?n:fib(n-1)+fib(n-2); }\n\n    public static void main(String[] args){\n        System.out.println("Hello from Java! ☕");\n        System.out.print("Fibonacci: ");\n        for(int i=0;i<=10;i++)\n            System.out.print(fib(i)+(i<10?", ":"\\n"));\n        List<String> langs = new ArrayList<>();\n        langs.add("Java"); langs.add("Python"); langs.add("Go");\n        System.out.println("Languages: " + langs);\n    }\n}`
  },
  {
    id:'lua',label:'Lua',ext:['lua'],dot:'#000080',
    cm:'lua',piston:'WASM',
    code:`-- Lua — runs in browser via wasmoon (no internet needed after first load)\nprint("Hello from Lua! 🌙")\n\nlocal function fib(n)\n    if n <= 1 then return n end\n    return fib(n-1) + fib(n-2)\nend\n\nlocal fibs = {}\nfor i = 0, 10 do fibs[#fibs+1] = fib(i) end\nprint("Fibonacci: " .. table.concat(fibs, ", "))\n\nlocal t = {name="CodeForge", ver=2.0, langs={"Lua","Python","C++"}}\nprint("Name: " .. t.name)\nfor i,l in ipairs(t.langs) do print("  "..i..". "..l) end`
  },
  {
    id:'rust',label:'Rust',ext:['rs'],dot:'#dea584',
    cm:'rust',piston:'rust',
    code:`// Rust — via Piston API\nfn fib(n:u64)->u64{ if n<=1{n}else{fib(n-1)+fib(n-2)} }\n\nfn main(){\n    println!("Hello from Rust! 🦀");\n    let seq:Vec<u64>=(0..=10).map(fib).collect();\n    let s:Vec<String>=seq.iter().map(|x|x.to_string()).collect();\n    println!("Fibonacci: {}",s.join(", "));\n    let squares:Vec<i32>=(1..=5).map(|x|x*x).collect();\n    println!("Squares: {:?}",squares);\n}`
  },
  {
    id:'go',label:'Go',ext:['go'],dot:'#00add8',
    cm:'go',piston:'go',
    code:`// Go — via Piston API\npackage main\nimport "fmt"\n\nfunc fib(n int) int {\n    if n <= 1 { return n }\n    return fib(n-1) + fib(n-2)\n}\n\nfunc main(){\n    fmt.Println("Hello from Go! 🐹")\n    fibs := make([]int, 11)\n    for i := range fibs { fibs[i] = fib(i) }\n    fmt.Println("Fibonacci:", fibs)\n    squares := make([]int, 5)\n    for i := range squares { squares[i] = (i+1)*(i+1) }\n    fmt.Println("Squares:", squares)\n}`
  },
  {
    id:'ruby',label:'Ruby',ext:['rb'],dot:'#701516',
    cm:'ruby',piston:'ruby',
    code:`# Ruby — via Piston API\nputs "Hello from Ruby! 💎"\n\ndef fib(n) = n <= 1 ? n : fib(n-1) + fib(n-2)\n\nputs "Fibonacci: #{(0..10).map{|i| fib(i)}.join(', ')}"\nputs "Squares: #{(1..5).map{|n| n**2}}"`
  },
  {
    id:'php',label:'PHP',ext:['php'],dot:'#4f5d95',
    cm:'php',piston:'php',
    code:`<?php\n// PHP — via Piston API\necho "Hello from PHP! 🐘\\n";\n\nfunction fib($n){ return $n<=1?$n:fib($n-1)+fib($n-2); }\n$fibs = array_map('fib', range(0,10));\necho "Fibonacci: " . implode(", ", $fibs) . "\\n";\n\n$person = ["name"=>"CodeForge","version"=>2.0];\nforeach($person as $k=>$v) echo "$k: $v\\n";\n?>`
  },
  {
    id:'bash',label:'Bash',ext:['sh','bash'],dot:'#89e051',
    cm:'shell',piston:'bash',
    code:`#!/bin/bash\n# Bash — via Piston API\necho "Hello from Bash! 🐚"\n\nNAME="CodeForge"\necho "Welcome to $NAME v2.0"\n\nLANGS=("JavaScript" "Python" "C++" "Lua" "Rust" "Go")\necho "Languages:"\nfor l in "\${LANGS[@]}"; do echo "  - $l"; done\n\necho "Math:"\necho "  5 + 3 = $((5+3))"\necho "  2^10 = $((2**10))"`
  },
];

