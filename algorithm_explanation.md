# Algorithm Explanation

This problem is clasic clustring problem in which we group our data according to similarities in it's features. In this exercise I have used K-Means algorithm to plan parties.

You can read more about [K-Means Algorithm Here](https://en.wikipedia.org/wiki/K-means_clustering)

In the problem given I needed to group data in a fix count and I needed to allocate every user to a party. So I used approach of recursive k-means clustering (this is just something I am calling my technique). First I rank every datapoint in the dataset in int values (designation, gender, department, personality & interests,)I make clusters of min &lt;number_of_members&gt;/6 and then start extracting grouped users of 6 each. When I am done with the first iteration of grouping I delete the grouped members from my hash map and run the clustering process again. My algorithm repeats this process untill I am left with member_count &lt; 6, then I assign those members randomly to other parties (This is because there is requirment of 6-8 users per party.).

After the grouping process is done I name my parties depending upon the max no of words in my party.
