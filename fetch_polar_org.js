const token = 'polar_oat_JMooyGAfqGhyDmyxpfN4mGScXpEyCBuHSwkEU0QacJn';
fetch('https://api.polar.sh/v1/organizations?page=1&limit=10', {
    headers: { 'Authorization': `Bearer ${token}` }
})
    .then(res => res.json())
    .then(data => {
        if (data.items && data.items.length > 0) {
            console.log('ORGANIZATION_ID:', data.items[0].id);
        } else {
            console.log('No organizations found');
        }
    })
    .catch(err => console.error(err));
