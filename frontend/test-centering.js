console.log("Adding debug script...");
const script = document.createElement('script');
script.innerHTML = `
  setTimeout(() => {
    const title = document.querySelector('h1');
    const paragraph = document.querySelector('p');
    const grid = document.querySelector('.grid');
    const titleRect = title.getBoundingClientRect();
    const paraRect = paragraph.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    console.log('Title Center:', titleRect.left + titleRect.width/2);
    console.log('Para Center:', paraRect.left + paraRect.width/2);
    console.log('Grid Center:', gridRect.left + gridRect.width/2);
    console.log('Grid Left:', gridRect.left, 'Grid Right:', gridRect.right, 'Grid Width:', gridRect.width);
  }, 2000);
`;
document.body.appendChild(script);
